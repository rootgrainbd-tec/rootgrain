import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

/**
 * Interactive transaction adapter.
 * The caller/workflow owns the transaction.
 * All transactional operations MUST use the provided `tx` client.
 * Nested runInTransaction calls are an architectural violation and are not supported.
 */
export async function runInTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  // Prisma's $transaction automatically handles rollback if the operation throws.
  return await prisma.$transaction(async (tx) => {
    return await operation(tx)
  })
}
