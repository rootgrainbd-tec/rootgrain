export class IntegrationException extends Error {
  constructor(message: string, public readonly code: string, public readonly domain?: string) {
    super(message);
    this.name = 'IntegrationException';
  }
}
