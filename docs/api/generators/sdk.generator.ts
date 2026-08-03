import { ApiSpecificationContract, GeneratorContract } from '../contracts/api-specification.contract';

export class SdkGenerator implements GeneratorContract {
  generate(specification: ApiSpecificationContract): void {
    console.log('Generating SDK definitions from OpenAPI specification (stub)...');
    // Reads specification and emits Typescript/Client interfaces
  }
}
