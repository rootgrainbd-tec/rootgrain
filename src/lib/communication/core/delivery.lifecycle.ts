import { CommunicationContext, CommunicationState } from './communication.context';
import { CommunicationException } from '../exceptions/communication.exception';

export class DeliveryLifecycle {
  static transition(context: CommunicationContext, newState: CommunicationState, error?: string): CommunicationContext {
    const validTransitions: Record<CommunicationState, CommunicationState[]> = {
      [CommunicationState.CREATED]: [CommunicationState.VALIDATED, CommunicationState.CANCELLED, CommunicationState.FAILED],
      [CommunicationState.VALIDATED]: [CommunicationState.QUEUED, CommunicationState.CANCELLED, CommunicationState.FAILED],
      [CommunicationState.QUEUED]: [CommunicationState.SENT, CommunicationState.CANCELLED, CommunicationState.FAILED],
      [CommunicationState.SENT]: [],
      [CommunicationState.FAILED]: [],
      [CommunicationState.CANCELLED]: []
    };

    if (!validTransitions[context.state].includes(newState)) {
      throw CommunicationException.lifecycle(`Invalid transition from ${context.state} to ${newState}`, { notificationId: context.notificationId });
    }

    return Object.freeze({
      ...context,
      state: newState,
      error,
      timestamp: Date.now()
    });
  }
}
