export class RequestMiddleware {
  static process(req: any): any {
    // In a full implementation, this parses the raw HTTP request into an ApiRequest<T>
    // For this structural foundation, we enforce immutability and payload existence.
    if (!req) {
      throw new Error('Request cannot be null');
    }
    return Object.freeze({
      payload: req.body || {},
      query: req.query || {},
      params: req.params || {},
      timestamp: new Date(),
      requestId: req.headers?.['x-request-id'] || 'generated-id'
    });
  }
}
