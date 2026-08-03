import * as fs from 'fs';
import * as path from 'path';

export class SchemaValidator {
  static validate(schemaDir: string): boolean {
    const files = fs.readdirSync(schemaDir);
    const required = ['common.yaml', 'resource.yaml', 'inventory.yaml', 'production.yaml', 'orders.yaml', 'accounting.yaml', 'reporting.yaml'];
    for (const req of required) {
      if (!files.includes(req)) throw new Error(`Missing required schema file: ${req}`);
    }
    return true;
  }
}
