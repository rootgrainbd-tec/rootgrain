import { CommunicationException } from '../exceptions/communication.exception';

export class DeliveryPolicy {
  static evaluateTimeBounds(currentHour: number, allowedStart: number, allowedEnd: number): void {
     if (currentHour < allowedStart || currentHour >= allowedEnd) {
       throw CommunicationException.delivery('Delivery attempted outside of allowed time bounds');
     }
  }
}
