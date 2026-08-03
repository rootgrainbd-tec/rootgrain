import { ControlContract } from '../governance/control.contract';

export interface SecurityControl extends ControlContract {
  readonly expected_outcome: string;
}
