import { SecurityControl } from './security.control';

export interface DataControl extends SecurityControl {
  readonly type: 'data_classification' | 'data_handling';
}
