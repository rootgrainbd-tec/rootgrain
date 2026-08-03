import { ApiSpecificationContract, GeneratorContract } from '../contracts/api-specification.contract';

export class SpecificationGenerator implements GeneratorContract {
  generate(specification: ApiSpecificationContract): void {
    console.log('Consolidating OpenAPI YAML files into a singular build artifact (stub)...');
  }
}
