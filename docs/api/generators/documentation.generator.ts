import { ApiSpecificationContract, GeneratorContract } from '../contracts/api-specification.contract';

export class DocumentationGenerator implements GeneratorContract {
  generate(specification: ApiSpecificationContract): void {
    console.log('Generating HTML Documentation from OpenAPI specification (stub)...');
    // Renders the YAML tree into a readable developer portal
  }
}
