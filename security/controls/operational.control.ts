import { SecurityControl } from './security.control';

export interface OperationalControl extends SecurityControl {
  readonly type: 'change_tracking' | 'operational_review';
}
