import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../src/services/order.service';
import { OrderRepository } from '../src/repositories/order.repository';
import { hashGuestTrackingToken } from '../src/lib/capability-token';
import { AppError } from '../src/lib/errors/AppError';

vi.mock('../src/repositories/order.repository');

const TEST_RAW_TOKEN = "test-raw-capability-token-value-that-would-be-base64";
const TEST_HASH = hashGuestTrackingToken(TEST_RAW_TOKEN);

describe('NEXT-SEC-02 Slice 3 - Track API Capability Token Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('New guest order with valid capability token -> success', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-123',
      guestTokenHash: TEST_HASH,
      shippingAddress: { email: 'guest@test.com' }
    } as any);

    const order = await OrderService.getOrderDetails('ORD-123', undefined, undefined, TEST_RAW_TOKEN);
    expect(order.id).toBe('order-1');
  });

  it('New guest order with invalid capability token -> Unauthorized', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-123',
      guestTokenHash: TEST_HASH,
      shippingAddress: { email: 'guest@test.com' }
    } as any);

    await expect(OrderService.getOrderDetails('ORD-123', undefined, undefined, 'wrong-token'))
      .rejects.toThrow(AppError);
    await expect(OrderService.getOrderDetails('ORD-123', undefined, undefined, 'wrong-token'))
      .rejects.toThrow("Order not found or unauthorized access");
  });

  it('New guest order with missing token -> Unauthorized', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-123',
      guestTokenHash: TEST_HASH,
      shippingAddress: { email: 'guest@test.com' }
    } as any);

    // Provide correct email but NO token. It should FAIL because guestTokenHash exists.
    await expect(OrderService.getOrderDetails('ORD-123', 'guest@test.com', undefined, undefined))
      .rejects.toThrow("Order not found or unauthorized access");
  });

  it('Legacy guest order with matching email -> success', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-2',
      orderNumber: 'ORD-456',
      guestTokenHash: null, // Legacy order (no hash)
      shippingAddress: { email: 'legacy@test.com' }
    } as any);

    const order = await OrderService.getOrderDetails('ORD-456', 'legacy@test.com', undefined, undefined);
    expect(order.id).toBe('order-2');
  });

  it('Legacy guest order with incorrect email -> Unauthorized', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-2',
      orderNumber: 'ORD-456',
      guestTokenHash: null,
      shippingAddress: { email: 'legacy@test.com' }
    } as any);

    await expect(OrderService.getOrderDetails('ORD-456', 'wrong@test.com', undefined, undefined))
      .rejects.toThrow("Order not found or unauthorized access");
  });

  it('Authenticated owner -> success (ignores token/hash completely)', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-3',
      orderNumber: 'ORD-789',
      userId: 'user-123',
      guestTokenHash: TEST_HASH, // Has hash, but owner is requesting
      shippingAddress: { email: 'user@test.com' }
    } as any);

    const order = await OrderService.getOrderDetails('ORD-789', undefined, 'user-123', undefined);
    expect(order.id).toBe('order-3');
  });
  
  it('Authenticated non-owner -> Unauthorized (unless token provided)', async () => {
    vi.mocked(OrderRepository.getOrderByNumber).mockResolvedValue({
      id: 'order-3',
      orderNumber: 'ORD-789',
      userId: 'user-123',
      guestTokenHash: TEST_HASH,
      shippingAddress: { email: 'user@test.com' }
    } as any);

    await expect(OrderService.getOrderDetails('ORD-789', undefined, 'user-999', undefined))
      .rejects.toThrow("Order not found or unauthorized access");
  });
});
