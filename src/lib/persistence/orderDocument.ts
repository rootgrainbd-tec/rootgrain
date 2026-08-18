import { Prisma } from '@prisma/client'

/**
 * Persists an OrderDocument record within an active transaction.
 *
 * @param tx The active transaction client
 * @param orderId The authoritative aggregate owner ID
 * @param documentType The type of the document (e.g. 'INVOICE')
 * @param referenceIdentity Polymorphic application-level identity representing the actual document (e.g. storage path or id)
 * @param snapshot Data snapshot used to generate the document
 * @param templateVersion Version of the template used
 * @param createdBy Identify of the actor who generated the document
 */
export async function createOrderDocument(
  tx: Prisma.TransactionClient,
  orderId: string,
  documentType: string,
  referenceIdentity: string,
  snapshot: any,
  templateVersion: string,
  createdBy: string
) {
  const document = await tx.orderDocument.create({
    data: {
      orderId,
      documentType,
      referenceIdentity,
      snapshot: snapshot ? (snapshot as Prisma.InputJsonValue) : Prisma.JsonNull,
      templateVersion,
      createdBy,
    },
  })

  return document
}
