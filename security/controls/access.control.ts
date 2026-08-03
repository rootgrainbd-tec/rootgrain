import { SecurityControl } from './security.control';

export interface AccessControl extends SecurityControl {
  readonly type: 'permission_review' | 'privilege_boundary';
}
