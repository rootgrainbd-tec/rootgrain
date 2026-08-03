export interface ApiSpecificationContract {
  version: string;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

export interface GeneratorContract {
  generate(specification: ApiSpecificationContract): void;
}
