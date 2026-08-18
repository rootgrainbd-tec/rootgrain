import { Prisma, NotificationOutboxStatus } from '@prisma/client'

/**
 * Persists a notification intent (outbox record) within an active transaction.
 *
 * @param tx The active transaction client
 * @param orderId The Order ID
 * @param eventReference The ID of the OrderEvent triggering this notification
 * @param notificationType The type of notification (e.g. 'ORDER_CONFIRMATION')
 * @param channel The delivery channel (e.g. 'EMAIL', 'WHATSAPP')
 */
export async function scheduleNotification(
  tx: Prisma.TransactionClient,
  orderId: string,
  eventReference: string,
  notificationType: string,
  channel: string
) {
  // Uses upsert to gracefully handle exact duplicates (eventReference, notificationType, channel)
  // per the uniqueness requirement. If it exists, we don't recreate it.
  const outbox = await tx.notificationOutbox.upsert({
    where: {
      eventReference_notificationType_channel: {
        eventReference,
        notificationType,
        channel,
      },
    },
    update: {}, // No-op if it already exists
    create: {
      orderId,
      eventReference,
      notificationType,
      channel,
      status: NotificationOutboxStatus.PENDING,
    },
  })

  return outbox
}
