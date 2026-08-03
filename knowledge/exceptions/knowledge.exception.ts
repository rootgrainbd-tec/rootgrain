export class KnowledgeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KnowledgeException';
  }

  static validation(message: string): KnowledgeException {
    return new KnowledgeException(`Knowledge Validation Failed: ${message}`);
  }

  static failClosed(message: string): KnowledgeException {
    return new KnowledgeException(`Fail Closed Knowledge Decision: ${message}`);
  }
}
