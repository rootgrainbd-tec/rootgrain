import { Prisma } from '@prisma/client'

/**
 * Acquires a FOR UPDATE row lock on the specified Order.
 * Must be executed inside an active transaction.
 *
 * @param tx The active transaction client
 * @param orderId The Order ID to lock
 * @returns The locked Order record
 * @throws {Error} with message 'NOT_FOUND' if the order does not exist
 */
export async function lockOrder(tx: Prisma.TransactionClient, orderId: string) {
  // Execute native SQL to guarantee FOR UPDATE semantics on the single aggregate
  const orders = await tx.$queryRaw<any[]>`
    SELECT * FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `

  if (!orders || orders.length === 0) {
    throw new Error('NOT_FOUND')
  }

  return orders[0]
}
