import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutService } from '../src/services/checkout.service';
import { ProductRepository } from '../src/repositories/product.repository';
import { ShippingRepository } from '../src/repositories/shipping.repository';
import { OrderRepository } from '../src/repositories/order.repository';
import { CartRepository } from '../src/repositories/cart.repository';
import { verifyGuestTrackingToken } from '../src/lib/capability-token';
import prisma from '../src/lib/prisma';

vi.mock('../src/repositories/product.repository');
vi.mock('../src/repositories/shipping.repository');
vi.mock('../src/repositories/promo.repository');
vi.mock('../src/repositories/cart.repository');
vi.mock('../src/inngest/client', () => ({
  inngest: { send: vi.fn() }
}));
vi.mock('../src/lib/prisma', () => {
  return {
    default: {
      $transaction: vi.fn(async (cb) => {
        return await cb({
          promoCode: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          order: { create: vi.fn() },
          orderEvent: { aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }), create: vi.fn().mockResolvedValue({ id: 'event-1' }) },
          orderDocument: { create: vi.fn().mockResolvedValue({ id: 'doc-1' }) },
          notificationOutbox: { upsert: vi.fn().mockResolvedValue({ id: 'outbox-1' }) }
        });
      })
    },
    prisma: {
      $transaction: vi.fn(async (cb) => {
        return await cb({
          promoCode: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          order: { create: vi.fn() },
          orderEvent: { aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }), create: vi.fn().mockResolvedValue({ id: 'event-1' }) },
          orderDocument: { create: vi.fn().mockResolvedValue({ id: 'doc-1' }) },
          notificationOutbox: { upsert: vi.fn().mockResolvedValue({ id: 'outbox-1' }) }
        });
      })
    }
  }
});
vi.mock('../src/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

const mockPayload = {
  items: [{ id: 'prod-1', quantity: 1 }],
  address: { name: 'Guest', email: 'guest@example.com', phone: '12345', street: '123 St', postCode: '1000' },
  district: 'Dhaka',
  division: 'Dhaka'
};

const mockProduct = {
  id: 'pid-1',
  slug: 'prod-1',
  name: 'Table',
  price: 100,
  isActive: true,
  inStock: true,
  shippingType: 'large'
};

describe('NEXT-SEC-02 Slice 2 - Checkout Token Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductRepository.findProductsBySlugs).mockResolvedValue([mockProduct as any]);
    vi.mocked(ShippingRepository.getAllShippingTypeRates as any).mockResolvedValue([{ shippingType: 'large', baseRate: 50, additionalRate: 10, isActive: true }]);
    vi.mocked(CartRepository.markCartsAsRecovered).mockResolvedValue({ count: 0 });
  });

  it('guest checkout generates token and stores only hash in database', async () => {
    let capturedData: any = null;
    (prisma as any).$transaction.mockImplementationOnce(async (cb: any) => {
      return await cb({
        promoCode: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        order: { create: async (data: any) => {
          capturedData = data.data;
          return { id: 'order-1', orderNumber: data.data.orderNumber };
        }},
        orderEvent: { aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }), create: vi.fn().mockResolvedValue({ id: 'event-1' }) },
        orderDocument: { create: vi.fn().mockResolvedValue({ id: 'doc-1' }) },
        notificationOutbox: { upsert: vi.fn().mockResolvedValue({ id: 'outbox-1' }) }
      });
    });

    const { order, rawGuestToken } = await CheckoutService.processCheckout(mockPayload, null);

    expect(order.id).toBe('order-1');
    expect(rawGuestToken).toBeTruthy();
    
    // Check that OrderRepository received the hash
    expect(capturedData).toBeTruthy();
    const storedHash = capturedData.guestTokenHash;
    expect(storedHash).toBeTruthy();
    expect(storedHash).not.toBe(rawGuestToken); // Raw token is NOT stored

    // Verify hash matches
    expect(verifyGuestTrackingToken(rawGuestToken!, storedHash)).toBe(true);
  });

  it('authenticated checkout does not generate guest token', async () => {
    let capturedData: any = null;
    (prisma as any).$transaction.mockImplementationOnce(async (cb: any) => {
      return await cb({
        promoCode: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        order: { create: async (data: any) => {
          capturedData = data.data;
          return { id: 'order-2', orderNumber: data.data.orderNumber };
        }},
        orderEvent: { aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }), create: vi.fn().mockResolvedValue({ id: 'event-2' }) },
        orderDocument: { create: vi.fn().mockResolvedValue({ id: 'doc-1' }) },
        notificationOutbox: { upsert: vi.fn().mockResolvedValue({ id: 'outbox-1' }) }
      });
    });

    const { order, rawGuestToken } = await CheckoutService.processCheckout(mockPayload, 'user-123');

    expect(order.id).toBe('order-2');
    expect(rawGuestToken).toBeUndefined();
    
    expect(capturedData).toBeTruthy();
    expect(capturedData.guestTokenHash).toBeUndefined(); // Should not exist for auth user
  });

  it('rollback on persistence failure (simulated by throwing in createOrder)', async () => {
    (prisma as any).$transaction.mockRejectedValueOnce(new Error('DB Error'));

    await expect(CheckoutService.processCheckout(mockPayload, null)).rejects.toThrow('DB Error');
    // Since transaction failed, nothing is committed to the database
  });
});
