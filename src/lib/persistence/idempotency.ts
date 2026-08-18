import { Prisma, IdempotencyOwnerType, IdempotencyStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IdempotencyConflictError'
  }
}

export class IdempotencyClaimConflictSignal extends Error {
  constructor() {
    super('Idempotency Claim Conflict')
    this.name = 'IdempotencyClaimConflictSignal'
  }
}

export interface IdempotencyIdentity {
  ownerType: IdempotencyOwnerType
  ownerId: string
  scope: string
  key: string
  fingerprint: string
}

/**
 * Claims the idempotency key within the active transaction.
 * If a P2002 conflict occurs on the exact uniqueness constraint, it throws
 * an IdempotencyClaimConflictSignal to intentionally abort the transaction.
 */
export async function claimIdempotencyKey(
  tx: Prisma.TransactionClient,
  identity: IdempotencyIdentity
) {
  try {
    await tx.idempotencyKey.create({
      data: {
        ownerType: identity.ownerType,
        ownerId: identity.ownerId,
        scope: identity.scope,
        key: identity.key,
        fingerprint: identity.fingerprint,
        status: IdempotencyStatus.IN_PROGRESS,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target as string[] | string | undefined
      // Prisma typically formats target as an array of column names or a string depending on DB.
      // Postgres usually gives an array like ['ownerType', 'ownerId', 'scope', 'key'] or string "IdempotencyKey_ownerType_ownerId_scope_key_key"
      const isTargetMatch =
        (Array.isArray(target) && target.includes('key') && target.includes('ownerId')) ||
        (typeof target === 'string' && target.includes('IdempotencyKey_ownerType_ownerId_scope_key_key'))

      if (isTargetMatch) {
        throw new IdempotencyClaimConflictSignal()
      }
    }
    // Unrelated error or unrelated P2002
    throw error
  }
}

/**
 * Completes the idempotency key within the active transaction.
 */
export async function completeIdempotencyKey(
  tx: Prisma.TransactionClient,
  identity: IdempotencyIdentity,
  resultReference: string | null = null,
  responsePayload: any = null
) {
  await tx.idempotencyKey.update({
    where: {
      ownerType_ownerId_scope_key: {
        ownerType: identity.ownerType,
        ownerId: identity.ownerId,
        scope: identity.scope,
        key: identity.key,
      },
    },
    data: {
      status: IdempotencyStatus.COMPLETED,
      resultReference,
      responsePayload: responsePayload ? (responsePayload as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })
}

/**
 * Recovery read performed OUTSIDE the aborted transaction.
 * Uses the global non-aborted Prisma client.
 */
export async function recoverIdempotencyKey(identity: IdempotencyIdentity) {
  const existing = await prisma.idempotencyKey.findUnique({
    where: {
      ownerType_ownerId_scope_key: {
        ownerType: identity.ownerType,
        ownerId: identity.ownerId,
        scope: identity.scope,
        key: identity.key,
      },
    },
  })

  if (!existing) {
    // Highly unusual: another transaction claimed it but then rolled back before we could read it
    throw new IdempotencyConflictError('Idempotency key vanished during recovery')
  }

  if (existing.fingerprint !== identity.fingerprint) {
    throw new IdempotencyConflictError('IDEMPOTENCY_CONFLICT')
  }

  if (existing.status === IdempotencyStatus.IN_PROGRESS) {
    // Previous transaction crashed or is still running
    throw new IdempotencyConflictError('Concurrent operation in progress')
  }

  // Same fingerprint and COMPLETED
  return {
    replayed: true,
    resultReference: existing.resultReference,
    responsePayload: existing.responsePayload,
  }
}
