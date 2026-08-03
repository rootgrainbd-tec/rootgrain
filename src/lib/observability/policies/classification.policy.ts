export enum AuditClassification {
  SECURITY = 'SECURITY',
  WORKFLOW = 'WORKFLOW',
  API = 'API',
  SYSTEM = 'SYSTEM'
}

export class ClassificationPolicy {
  static validate(classification: AuditClassification): boolean {
    return Object.values(AuditClassification).includes(classification);
  }
}
