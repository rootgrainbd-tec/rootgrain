import * as fs from 'fs';
import * as path from 'path';

export class OpenApiValidator {
  static validateStructure(yamlRootPath: string): boolean {
    const root = fs.readFileSync(path.join(yamlRootPath, 'openapi.yaml'), 'utf8');
    if (!root.includes('openapi: 3.1.0')) throw new Error('Must use OpenAPI 3.1.0');
    if (!root.includes('info.yaml')) throw new Error('Missing info reference');
    return true;
  }
}
