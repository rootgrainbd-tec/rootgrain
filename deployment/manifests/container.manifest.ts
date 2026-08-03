import { ContainerContract } from '../container/container.contract';

export interface ContainerManifest {
  readonly container_contract: ContainerContract;
  readonly state: 'CREATED' | 'BUILT' | 'VALIDATED' | 'PACKAGED' | 'PUBLISHED' | 'FAILED';
}
