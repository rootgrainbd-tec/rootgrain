import { Prisma } from '@prisma/client'

/**
 * Appends an event to the Order aggregate.
 * Must be executed within an active transaction.
 *
 * It uses the locked Order transaction context to compute the next sequence securely.
 */
export async function appendOrderEvent(
  tx: Prisma.TransactionClient,
  orderId: string,
  eventType: string,
  payload: any,
  actor: any
) {
  const maxEvent = await tx.orderEvent.aggregate({
    where: { orderId },
    _max: { sequence: true },
  })

  const nextSequence = (maxEvent._max.sequence ?? 0) + 1

  const event = await tx.orderEvent.create({
    data: {
      orderId,
      sequence: nextSequence,
      eventType,
      payload: payload ? (payload as Prisma.InputJsonValue) : Prisma.JsonNull,
      actor: actor ? (actor as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })

  return event
}
