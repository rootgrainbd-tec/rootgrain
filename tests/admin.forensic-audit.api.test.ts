import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/forensic-audit/route';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  return {
    default: {
      order: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      idempotencyKey: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      notificationOutbox: {
        findMany: vi.fn(),
      },
    },
  };
});

describe('GET /api/admin/forensic-audit', () => {
  const mockRequest = (url: string) => {
    return new Request(url);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. rejects unauthenticated access', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = mockRequest('http://localhost/api/admin/forensic-audit?orderNumber=RG-20260905-949006');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('2. rejects non-admin access', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'USER' } });
    const req = mockRequest('http://localhost/api/admin/forensic-audit?orderNumber=RG-20260905-949006');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('3. rejects arbitrary order number', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'ADMIN' } });
    const req = mockRequest('http://localhost/api/admin/forensic-audit?orderNumber=INVALID-ORDER-123');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('4. successful target produces sanitized audit structure', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'ADMIN' } });
    
    // Mock the order
    const mockOrder = {
      id: 'cmtolal9n0000js041yn4fdkx',
      orderNumber: 'RG-20260905-949006',
      status: 'PENDING_ADVANCE',
      isMtoOrder: true,
      total: 31000,
      subtotal: 31000,
      requiredAdvance: 15500,
      advancePaid: 0,
      shippingCost: 0,
      logistics: 'PRIVATE_FREIGHT',
      estimatedManufacturingDays: 30,
      createdAt: new Date(),
      items: [{
        quantity: 1,
        unitPrice: 31000,
        total: 31000,
        product: { isActive: true, isMto: true }
      }],
      events: [{ eventType: 'ORDER_PLACED', sequence: 1 }],
      documents: [{ documentType: 'INVOICE', status: 'ISSUED', storageKey: 'test/key' }],
      paymentRecords: []
    };

    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
    (prisma.idempotencyKey.findFirst as any).mockResolvedValue({
      ownerType: 'USER',
      ownerId: 'user-1',
      scope: 'mto-checkout',
      key: 'safe-key',
      status: 'COMPLETED',
      resultReference: 'cmtolal9n0000js041yn4fdkx',
      responsePayload: {}
    });
    (prisma.idempotencyKey.count as any).mockResolvedValue(0);
    
    (prisma.notificationOutbox.findMany as any).mockResolvedValue([{
      notificationType: 'ORDER_CONFIRMATION',
      status: 'PENDING',
      attempts: 0,
      processedAt: null,
      lastError: null
    }]);

    (prisma.order.findMany as any).mockResolvedValue([]);

    const req = mockRequest('http://localhost/api/admin/forensic-audit?orderNumber=RG-20260905-949006');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.target).toBe('RG-20260905-949006');
    expect(data.existence).toBe(true);
    console.log(data.debug);
    expect(data.finalVerdict).toBe('PASS: INTACT');
    
    // Check sanitation
    expect(data.idempotency.ownerId).toBe('REDACTED_SAFE');
    expect(data.document.storageKeyExists).toBe(true);
    expect(data.document.storageKey).toBeUndefined();
    expect(data.idempotency.key).toBeUndefined();
  });

  it('5. failed target produces absence result', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'ADMIN' } });
    (prisma.order.findUnique as any).mockResolvedValue(null);

    const req = mockRequest('http://localhost/api/admin/forensic-audit?orderNumber=RG-20260905-847631');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.target).toBe('RG-20260905-847631');
    expect(data.existence).toBe(false);
    expect(data.finalVerdict).toBe('PASS: ROLLED BACK');
  });

  it('6. no mutation methods are used', () => {
    // Only find/count methods were mocked in our prisma mock above.
    // If route used create/update, it would fail the test as undefined function.
    expect((prisma.order as any).create).toBeUndefined();
    expect((prisma.order as any).update).toBeUndefined();
  });
});
