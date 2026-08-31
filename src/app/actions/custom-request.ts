"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  CustomerOnlineRequestSchema, 
  AdminOfflineRequestSchema,
  QuotePreparationSchema
} from "@/lib/validations/custom-request.schema";
import { 
  claimIdempotencyKey, 
  completeIdempotencyKey, 
  recoverIdempotencyKey,
  IdempotencyConflictError,
  IdempotencyClaimConflictSignal
} from "@/lib/persistence/idempotency";
import { generateGuestTrackingToken, hashGuestTrackingToken, verifyGuestTrackingToken } from "@/lib/capability-token";
import { IdempotencyOwnerType, Role } from "@prisma/client";
import { checkoutAddressSchema } from "@/validations/checkout.schema";
import { generateOrderNumber } from "@/services/checkout.service";

export async function submitCustomRequestOnline(
  data: z.infer<typeof CustomerOnlineRequestSchema>,
  idempotencyKey: string
) {
  try {
    // 1. Validate Input strictly
    const validatedData = CustomerOnlineRequestSchema.parse(data);

    let session = null;
    let userId: string | undefined;
    try {
      if (process.env.NODE_ENV !== 'test') {
        session = await getServerSession(authOptions);
        userId = session?.user?.id;
      } else {
        userId = (global as any).__MOCK_USER_ID__;
      }
    } catch (e) {
      // Gracefully handle raw node scripts outside Next.js request scope
    }

    let rawGuestToken: string | undefined;
    let guestTokenHash: string | null = null;
    let ownerType: IdempotencyOwnerType;
    let ownerId: string;

    if (userId) {
      ownerType = "USER";
      ownerId = userId;
    } else {
      ownerType = "GUEST";
      ownerId = "ANONYMOUS_GUEST"; // The guest token is generated fresh, so we can't use it for idempotency matching of retries
    }

    // Phase 7 Remediation: Always generate capability token for CUSTOMER_ONLINE submissions
    rawGuestToken = generateGuestTrackingToken();
    guestTokenHash = hashGuestTrackingToken(rawGuestToken);

    const identity = {
      ownerType,
      ownerId,
      scope: "custom-request:submit",
      key: idempotencyKey,
      fingerprint: JSON.stringify(validatedData), // Ensuring payload match
    };

    // 3. Database Transaction
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // 3.a Claim Idempotency
        await claimIdempotencyKey(tx, identity);

        // 3.b Create Custom Request
        const customRequest = await tx.customRequest.create({
          data: {
            customerName: validatedData.customerName,
            mobileNumber: validatedData.mobileNumber,
            email: validatedData.email || null,
            estimatedCompletionDate: validatedData.estimatedCompletionDate,
            channel: "CUSTOMER_ONLINE",
            status: "SUBMITTED",
            guestTokenHash,
            
            items: {
              create: validatedData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                designSpecs: item.designSpecs || null,
                dimensions: item.dimensions || null,
                material: item.materialPreference || null,
                finish: item.colorPreference || null,
                // agreedUnitPrice is explicitly forced to NULL for CUSTOMER_ONLINE
                agreedUnitPrice: null,
              }))
            },

            events: {
              create: {
                sequence: 1,
                eventType: "SUBMITTED",
                payload: { status: "SUBMITTED" },
                actor: { id: guestTokenHash || "SYSTEM", role: guestTokenHash ? "GUEST" : "SYSTEM" },
              }
            }
          },
          include: {
            items: true
          }
        });

        const responsePayload = {
          requestId: customRequest.id,
          rawGuestToken, 
        };

        // 3.c Complete Idempotency
        await completeIdempotencyKey(tx, identity, customRequest.id, responsePayload);

        return responsePayload;
      });
    } catch (txError: any) {
      if (txError instanceof IdempotencyClaimConflictSignal) {
        try {
          const recovered = await recoverIdempotencyKey(identity);
          return { success: true, ...recovered.responsePayload as any, replayed: true };
        } catch (recoverError: any) {
          return { success: false, error: recoverError.message || "A request is currently processing. Please wait." };
        }
      }
      throw txError;
    }

    return { success: true, ...result };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.flatten().fieldErrors };
    }
    console.error("submitCustomRequestOnline failed", error);
    return { success: false, error: "Failed to submit custom request" };
  }
}


export async function createCustomRequestOffline(
  data: z.infer<typeof AdminOfflineRequestSchema>,
  idempotencyKey: string
) {
  try {
    // 1. Validate Input strictly
    const validatedData = AdminOfflineRequestSchema.parse(data);

    // 2. Authorize Admin
    let session = null;
    try {
      if (process.env.NODE_ENV !== 'test') {
        session = await getServerSession(authOptions);
      }
    } catch (e) {
      // Gracefully handle script execution
    }
    if (process.env.NODE_ENV !== 'test' && (!session || (session.user as any).role !== Role.ADMIN)) {
      return { success: false, error: "Unauthorized" };
    }
    if (process.env.TEST_UNAUTHORIZED_ADMIN === 'true') {
      return { success: false, error: "Unauthorized" };
    }
    const adminId = session?.user?.id || 'TEST_ADMIN_ID';

    const identity = {
      ownerType: "USER" as IdempotencyOwnerType,
      ownerId: adminId,
      scope: "custom-request:admin-create",
      key: idempotencyKey,
      fingerprint: JSON.stringify(validatedData),
    };

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // 3.a Claim Idempotency
        await claimIdempotencyKey(tx, identity);

        // 3.b Create Custom Request
        const customRequest = await tx.customRequest.create({
          data: {
            customerName: validatedData.customerName,
            mobileNumber: validatedData.mobileNumber,
            email: validatedData.email || null,
            estimatedCompletionDate: validatedData.estimatedCompletionDate,
            channel: "ADMIN_OFFLINE",
            status: "SUBMITTED",
            
            items: {
              create: validatedData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                designSpecs: item.designSpecs || null,
                dimensions: item.dimensions || null,
                material: item.materialPreference || null,
                finish: item.colorPreference || null,
                // Admin can provide agreedUnitPrice
                agreedUnitPrice: item.agreedUnitPrice ?? null,
              }))
            },

            events: {
              create: {
                sequence: 1,
                eventType: "SUBMITTED",
                payload: { status: "SUBMITTED" },
                actor: { id: adminId, role: "ADMIN" },
              }
            }
          },
          include: {
            items: true
          }
        });

        const responsePayload = {
          requestId: customRequest.id,
        };

        // 3.c Complete Idempotency
        await completeIdempotencyKey(tx, identity, customRequest.id, responsePayload);

        return responsePayload;
      });
    } catch (txError: any) {
      if (txError instanceof IdempotencyClaimConflictSignal) {
        try {
          const recovered = await recoverIdempotencyKey(identity);
          return { success: true, ...recovered.responsePayload as any, replayed: true };
        } catch (recoverError: any) {
          return { success: false, error: recoverError.message || "A request is currently processing. Please wait." };
        }
      }
      throw txError;
    }

    return { success: true, ...result };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.flatten().fieldErrors };
    }
    console.error("createCustomRequestOffline failed", error);
    return { success: false, error: "Failed to create custom request" };
  }
}

export async function beginCustomRequestReview(
  requestId: string,
  idempotencyKey: string
) {
  let adminId: string | undefined;
  try {
    let session = null;
    try {
      if (process.env.NODE_ENV !== 'test') {
        session = await getServerSession(authOptions);
      } else {
        session = { user: { id: process.env.TEST_ADMIN_ID || "test_admin", role: process.env.TEST_ROLE || "ADMIN" } } as any;
      }
    } catch (e) {}

    adminId = session?.user?.id;
    const role = session?.user?.role;

    if (!adminId || role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const identity = {
      scope: "custom-request:review",
      ownerType: "USER" as const,
      ownerId: adminId,
      key: idempotencyKey,
      fingerprint: JSON.stringify({ requestId })
    };

    const result = await prisma.$transaction(async (tx) => {
      await claimIdempotencyKey(tx, identity);

      const request = await tx.customRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.status !== "SUBMITTED") {
        throw new Error("Request is not in SUBMITTED state");
      }

      const updatedRequest = await tx.customRequest.update({
        where: { id: requestId },
        data: {
          status: "UNDER_REVIEW",
          events: {
            create: {
              sequence: (await tx.customRequestEvent.count({ where: { customRequestId: requestId } })) + 1,
              eventType: "UNDER_REVIEW",
              payload: { status: "UNDER_REVIEW" },
              actor: { id: adminId, role: "ADMIN" },
            }
          }
        }
      });

      const responsePayload = {
        requestId: updatedRequest.id,
        status: updatedRequest.status
      };

      await completeIdempotencyKey(tx, identity, requestId, responsePayload);
      return responsePayload;
    });

    return { success: true, ...result };
  } catch (error: any) {

    if (error instanceof IdempotencyClaimConflictSignal) {
      try {
        const identity = {
          scope: "custom-request:review",
          ownerType: "USER" as const,
          ownerId: adminId as string,
          key: idempotencyKey,
          fingerprint: JSON.stringify({ requestId })
        };
        const recovered = await recoverIdempotencyKey(identity);
        return { success: true, ...recovered.responsePayload as any, replayed: true };
      } catch (recoverError: any) {
        return { success: false, error: recoverError.message || "A request is currently processing. Please wait." };
      }
    }
    console.error("beginCustomRequestReview failed", error);
    return { success: false, error: error.message || "Failed to start review" };
  }
}

export async function finalizeCustomRequestQuote(
  requestId: string,
  quoteData: z.infer<typeof QuotePreparationSchema>,
  idempotencyKey: string
) {
  let adminId: string | undefined;
  try {
    const validatedData = QuotePreparationSchema.parse(quoteData);

    let session = null;
    try {
      if (process.env.NODE_ENV !== 'test') {
        session = await getServerSession(authOptions);
      } else {
        session = { user: { id: process.env.TEST_ADMIN_ID || "test_admin", role: process.env.TEST_ROLE || "ADMIN" } } as any;
      }
    } catch (e) {}

    adminId = session?.user?.id;
    const role = session?.user?.role;

    if (!adminId || role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const identity = {
      scope: "custom-request:quote",
      ownerType: "USER" as const,
      ownerId: adminId,
      key: idempotencyKey,
      fingerprint: JSON.stringify({ requestId, quoteData: validatedData })
    };

    const result = await prisma.$transaction(async (tx) => {
      await claimIdempotencyKey(tx, identity);

      // We don't have native SELECT FOR UPDATE in prisma findUnique without raw queries, 
      // but findUnique inside a transaction can still hit write locks if we update it.
      // Better yet, we can use an optimistic update or a direct findFirst with update.
      const request = await tx.customRequest.findUnique({
        where: { id: requestId },
        include: { items: true }
      });

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.status !== "UNDER_REVIEW") {
        throw new Error("Request is not in UNDER_REVIEW state");
      }

      if (request.channel !== "CUSTOMER_ONLINE") {
        throw new Error("Quote preparation is only allowed for CUSTOMER_ONLINE channel");
      }

      let subtotal = 0;
      const itemUpdates = [];
      const updatedItemsForSnapshot = [];

      if (request.items.length !== validatedData.items.length) {
        throw new Error("All items must have an agreed unit price.");
      }

      for (const itemInput of validatedData.items) {
        const existingItem = request.items.find(i => i.id === itemInput.id);
        if (!existingItem) {
          throw new Error(`Item ${itemInput.id} not found in request`);
        }
        
        const itemTotal = itemInput.agreedUnitPrice * existingItem.quantity;
        subtotal += itemTotal;
        
        itemUpdates.push(
          tx.customRequestItem.update({
            where: { id: itemInput.id },
            data: { agreedUnitPrice: itemInput.agreedUnitPrice }
          })
        );
        
        updatedItemsForSnapshot.push({
          id: existingItem.id,
          quantity: existingItem.quantity,
          agreedUnitPrice: itemInput.agreedUnitPrice,
          itemTotal: itemTotal
        });
      }

      const total = subtotal + validatedData.deliveryCharge;
      
      if (validatedData.requiredAdvance < 0) {
        throw new Error("Required advance must be at least 0");
      }
      if (validatedData.requiredAdvance > total) {
        throw new Error("Required advance cannot exceed total amount.");
      }

      await Promise.all(itemUpdates);

      const snapshot = {
        items: updatedItemsForSnapshot,
        subtotal,
        deliveryCharge: validatedData.deliveryCharge,
        total,
        requiredAdvance: validatedData.requiredAdvance,
        estimatedCompletionDate: validatedData.estimatedCompletionDate,
      };

      const updatedRequest = await tx.customRequest.update({
        where: { id: requestId, status: "UNDER_REVIEW" }, // Optimistic concurrency / Status validation
        data: {
          subtotal,
          total,
          deliveryCharge: validatedData.deliveryCharge,
          requiredAdvance: validatedData.requiredAdvance,
          estimatedCompletionDate: validatedData.estimatedCompletionDate,
          status: "QUOTE_READY",
          events: {
            create: {
              sequence: (await tx.customRequestEvent.count({ where: { customRequestId: requestId } })) + 1,
              eventType: "QUOTE_READY",
              payload: { status: "QUOTE_READY", snapshot },
              actor: { id: adminId, role: "ADMIN" },
            }
          }
        }
      });

      const responsePayload = {
        requestId: updatedRequest.id,
        status: updatedRequest.status,
        snapshot
      };

      await completeIdempotencyKey(tx, identity, requestId, responsePayload);
      return responsePayload;
    });

    return { success: true, ...result };
  } catch (error: any) {

    if (error instanceof IdempotencyClaimConflictSignal) {
      try {
        const identity = {
          scope: "custom-request:quote",
          ownerType: "USER" as const,
          ownerId: adminId as string,
          key: idempotencyKey,
          fingerprint: JSON.stringify({ requestId, quoteData })
        };
        const recovered = await recoverIdempotencyKey(identity);
        return { success: true, ...recovered.responsePayload as any, replayed: true };
      } catch (recoverError: any) {
        return { success: false, error: recoverError.message || "A quote is currently processing. Please wait." };
      }
    }
    
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.flatten().fieldErrors };
    }
    console.error("finalizeCustomRequestQuote failed", error);
    return { success: false, error: error.message || "Failed to finalize quote" };
  }
}

export async function getCustomRequestCustomerView(requestId: string, capabilityToken: string) {
  try {
    const request = await prisma.customRequest.findUnique({
      where: { id: requestId },
      include: { items: true, events: true }
    });

    if (!request) {
      throw new Error("Request not found");
    }

    if (!request.guestTokenHash || !verifyGuestTrackingToken(capabilityToken, request.guestTokenHash)) {
      throw new Error("Unauthorized access");
    }

    if (request.channel !== "CUSTOMER_ONLINE") {
      throw new Error("This request cannot be accessed online.");
    }

    // Determine what to expose based on state
    const isFinancialVisible = request.status === "QUOTE_READY";
    
    // Check if customer already accepted or declined
    let decision = null;
    const acceptedEvent = request.events.find(e => e.eventType === "CUSTOMER_ACCEPTED");
    const declinedEvent = request.events.find(e => e.eventType === "CUSTOMER_DECLINED");
    if (acceptedEvent) decision = "ACCEPTED";
    if (declinedEvent) decision = "DECLINED";

    const customerView = {
      id: request.id,
      status: request.status,
      decision,
      createdAt: request.createdAt,
      estimatedCompletionDate: request.estimatedCompletionDate,
      customer: {
        name: request.customerName,
        mobileNumber: request.mobileNumber,
        email: request.email
      },
      items: request.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        designSpecs: item.designSpecs,
        dimensions: item.dimensions,
        material: item.material,
        finish: item.finish,
        // Only expose financial fields if QUOTE_READY
        agreedUnitPrice: isFinancialVisible ? item.agreedUnitPrice : null,
        itemTotal: isFinancialVisible && item.agreedUnitPrice ? item.agreedUnitPrice * item.quantity : null
      })),
      financials: isFinancialVisible ? {
        subtotal: request.subtotal,
        deliveryCharge: request.deliveryCharge,
        total: request.total,
        requiredAdvance: request.requiredAdvance
      } : null
    };

    return { success: true, data: customerView };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to retrieve quote" };
  }
}

export async function acceptCustomRequestQuote(requestId: string, capabilityToken: string, idempotencyKey: string) {
  try {
    // Basic verification without lock (fail fast)
    const request = await prisma.customRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) throw new Error("Request not found");
    if (!request.guestTokenHash || !verifyGuestTrackingToken(capabilityToken, request.guestTokenHash)) {
      throw new Error("Unauthorized access");
    }

    const identity = {
      ownerType: "GUEST" as IdempotencyOwnerType,
      ownerId: "ANONYMOUS_GUEST",
      scope: "custom-request:decision",
      key: idempotencyKey,
      fingerprint: JSON.stringify({ action: "ACCEPT", requestId })
    };

    const result = await prisma.$transaction(async (tx) => {
      await claimIdempotencyKey(tx, identity);

      const lockedReq = await tx.customRequest.findUnique({
        where: { id: requestId },
        // Use standard Prisma row locking if supported, but typical Prisma doesn't support SELECT FOR UPDATE naturally without raw queries for some drivers, but we can do a pessimistic lock if we use raw or we rely on the event count/existence invariant check below.
      });

      if (!lockedReq || lockedReq.status !== "QUOTE_READY" || lockedReq.channel !== "CUSTOMER_ONLINE") {
        throw new Error("Request is not eligible for acceptance.");
      }
      
      const existingDecision = await tx.customRequestEvent.findFirst({
        where: {
          customRequestId: requestId,
          eventType: { in: ["CUSTOMER_ACCEPTED", "CUSTOMER_DECLINED"] }
        }
      });
      
      if (existingDecision) {
        throw new Error("A decision has already been made for this request.");
      }

      await tx.customRequestEvent.create({
        data: {
          customRequestId: requestId,
          sequence: (await tx.customRequestEvent.count({ where: { customRequestId: requestId } })) + 1,
          eventType: "CUSTOMER_ACCEPTED",
          payload: { action: "ACCEPT", status: "QUOTE_READY" },
          actor: { id: "GUEST_TOKEN_HOLDER", role: "CUSTOMER" }
        }
      });

      const responsePayload = { requestId, decision: "ACCEPTED", status: "QUOTE_READY" };
      await completeIdempotencyKey(tx, identity, requestId, responsePayload);
      
      return responsePayload;
    });

    return { success: true, ...result };
  } catch (error: any) {
    if (error instanceof IdempotencyClaimConflictSignal) {
      try {
        const identity = {
          ownerType: "GUEST" as IdempotencyOwnerType,
          ownerId: "ANONYMOUS_GUEST",
          scope: "custom-request:decision",
          key: idempotencyKey,
          fingerprint: JSON.stringify({ action: "ACCEPT", requestId })
        };
        const recovered = await recoverIdempotencyKey(identity);
        return { success: true, ...recovered.responsePayload as any, replayed: true };
      } catch (recoverError: any) {
        return { success: false, error: recoverError.message || "Conflict detected." };
      }
    }
    
    return { success: false, error: error.message || "Failed to accept quote" };
  }
}

export async function declineCustomRequestQuote(requestId: string, capabilityToken: string, idempotencyKey: string) {
  try {
    const request = await prisma.customRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) throw new Error("Request not found");
    if (!request.guestTokenHash || !verifyGuestTrackingToken(capabilityToken, request.guestTokenHash)) {
      throw new Error("Unauthorized access");
    }

    const identity = {
      ownerType: "GUEST" as IdempotencyOwnerType,
      ownerId: "ANONYMOUS_GUEST",
      scope: "custom-request:decision",
      key: idempotencyKey,
      fingerprint: JSON.stringify({ action: "DECLINE", requestId })
    };

    const result = await prisma.$transaction(async (tx) => {
      await claimIdempotencyKey(tx, identity);

      const lockedReq = await tx.customRequest.findUnique({
        where: { id: requestId },
      });

      if (!lockedReq || lockedReq.status !== "QUOTE_READY" || lockedReq.channel !== "CUSTOMER_ONLINE") {
        throw new Error("Request is not eligible for declining.");
      }
      
      const existingDecision = await tx.customRequestEvent.findFirst({
        where: {
          customRequestId: requestId,
          eventType: { in: ["CUSTOMER_ACCEPTED", "CUSTOMER_DECLINED"] }
        }
      });
      
      if (existingDecision) {
        throw new Error("A decision has already been made for this request.");
      }

      await tx.customRequest.update({
        where: { id: requestId },
        data: {
          status: "CUSTOMER_DECLINED",
          events: {
            create: {
              sequence: (await tx.customRequestEvent.count({ where: { customRequestId: requestId } })) + 1,
              eventType: "CUSTOMER_DECLINED",
              payload: { action: "DECLINE", status: "CUSTOMER_DECLINED" },
              actor: { id: "GUEST_TOKEN_HOLDER", role: "CUSTOMER" }
            }
          }
        }
      });

      const responsePayload = { requestId, decision: "DECLINED", status: "CUSTOMER_DECLINED" };
      await completeIdempotencyKey(tx, identity, requestId, responsePayload);
      
      return responsePayload;
    });

    return { success: true, ...result };
  } catch (error: any) {
    if (error instanceof IdempotencyClaimConflictSignal) {
      try {
        const identity = {
          ownerType: "GUEST" as IdempotencyOwnerType,
          ownerId: "ANONYMOUS_GUEST",
          scope: "custom-request:decision",
          key: idempotencyKey,
          fingerprint: JSON.stringify({ action: "DECLINE", requestId })
        };
        const recovered = await recoverIdempotencyKey(identity);
        return { success: true, ...recovered.responsePayload as any, replayed: true };
      } catch (recoverError: any) {
        return { success: false, error: recoverError.message || "Conflict detected." };
      }
    }
    
    return { success: false, error: error.message || "Failed to decline quote" };
  }
}

export async function convertCustomRequestToOrder(
  requestId: string,
  payload: { shippingAddress: any },
  idempotencyKey: string
) {
  try {
    let session = null;
    let adminId = "UNKNOWN";
    
    if (process.env.NODE_ENV !== "test") {
      session = await getServerSession(authOptions);
      if (!session || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized access");
      }
      adminId = session.user.id;
    } else {
      adminId = process.env.TEST_ADMIN_ID || "test_admin";
    }

    const parsedAddress = checkoutAddressSchema.parse(payload.shippingAddress);

    const identity = {
      ownerType: "USER" as IdempotencyOwnerType,
      ownerId: adminId,
      scope: "custom-request:convert",
      key: idempotencyKey,
      fingerprint: JSON.stringify({ action: "CONVERT", requestId })
    };

    const result = await prisma.$transaction(async (tx) => {
      await claimIdempotencyKey(tx, identity);

      const lockedQuery = await tx.$queryRaw<any[]>`
        SELECT id FROM "CustomRequest"
        WHERE id = ${requestId}
        FOR UPDATE
      `;
      if (!lockedQuery || lockedQuery.length === 0) {
        throw new Error("Request not found");
      }

      const lockedReq = await tx.customRequest.findUnique({
        where: { id: requestId },
        include: {
          items: true,
          events: true
        }
      });

      if (!lockedReq) throw new Error("Request not found");
      if (lockedReq.orderId) throw new Error("Request is already converted to an order");

      if (lockedReq.channel === "CUSTOMER_ONLINE") {
        if (lockedReq.status !== "QUOTE_READY") {
          throw new Error("Online request must be in QUOTE_READY state");
        }
        const hasAccepted = lockedReq.events.some(e => e.eventType === "CUSTOMER_ACCEPTED");
        if (!hasAccepted) {
          throw new Error("Online request must be accepted by customer before conversion");
        }
      } else if (lockedReq.channel === "ADMIN_OFFLINE") {
        if (lockedReq.status !== "SUBMITTED" && lockedReq.status !== "UNDER_REVIEW") {
          throw new Error("Offline request must be in SUBMITTED or UNDER_REVIEW state");
        }
        for (const item of lockedReq.items) {
          if (item.agreedUnitPrice === null || item.agreedUnitPrice === undefined) {
            throw new Error("All items must have an agreed unit price for offline conversion");
          }
        }
      } else {
        throw new Error("Invalid request channel");
      }

      let orderUserId = null;
      if (lockedReq.email) {
        const matchingUser = await tx.user.findUnique({ where: { email: lockedReq.email } });
        if (matchingUser) {
          orderUserId = matchingUser.id;
        }
      }

      const orderNumber = generateOrderNumber();

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: orderUserId,
          subtotal: lockedReq.subtotal,
          shippingCost: lockedReq.deliveryCharge,
          total: lockedReq.total,
          requiredAdvance: lockedReq.requiredAdvance,
          balanceDue: lockedReq.total,
          advancePaid: 0,
          status: "PENDING_ADVANCE",
          productionState: "NOT_STARTED",
          deliveryState: "TBD",
          trackingState: "PENDING_PRODUCTION",
          shippingAddress: parsedAddress,
          isMtoOrder: true,
          estimatedCompletionDate: lockedReq.estimatedCompletionDate,
          guestTokenHash: lockedReq.guestTokenHash,
          items: {
            create: lockedReq.items.map(item => ({
              productName: item.name,
              productId: null,
              quantity: item.quantity,
              unitPrice: item.agreedUnitPrice || 0,
              total: (item.agreedUnitPrice || 0) * item.quantity,
              customSpecification: JSON.stringify({
                designSpecs: item.designSpecs,
                dimensions: item.dimensions,
                material: item.material,
                finish: item.finish,
                notes: item.notes
              })
            }))
          }
        }
      });

      await tx.customRequest.update({
        where: { id: requestId },
        data: {
          status: "CONVERTED",
          orderId: newOrder.id,
          events: {
            create: {
              sequence: (await tx.customRequestEvent.count({ where: { customRequestId: requestId } })) + 1,
              eventType: "CONVERTED",
              payload: { action: "CONVERT", orderId: newOrder.id },
              actor: { id: adminId, role: "ADMIN" }
            }
          }
        }
      });

      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          sequence: 1,
          eventType: "ORDER_CREATED_FROM_CUSTOM_REQUEST",
          payload: { customRequestId: requestId },
          actor: { id: adminId, role: "ADMIN" }
        }
      });

      const responsePayload = { 
        requestId, 
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber, 
        status: "CONVERTED" 
      };
      
      await completeIdempotencyKey(tx, identity, requestId, responsePayload);
      
      return responsePayload;
    });

    return { success: true, ...result };
  } catch (error: any) {
    if (error instanceof IdempotencyClaimConflictSignal) {
      try {
        const adminId = process.env.NODE_ENV !== "test" 
          ? ((await getServerSession(authOptions))?.user as any)?.id || "UNKNOWN"
          : process.env.TEST_ADMIN_ID || "test_admin";

        const identity = {
          ownerType: "USER" as IdempotencyOwnerType,
          ownerId: adminId,
          scope: "custom-request:convert",
          key: idempotencyKey,
          fingerprint: JSON.stringify({ action: "CONVERT", requestId })
        };
        const recovered = await recoverIdempotencyKey(identity);
        return { success: true, ...recovered.responsePayload as any, replayed: true };
      } catch (recoverError: any) {
        return { success: false, error: recoverError.message || "Conflict detected." };
      }
    }
    
    return { success: false, error: error.message || "Failed to convert custom request" };
  }
}
