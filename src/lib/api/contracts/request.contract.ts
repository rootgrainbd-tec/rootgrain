export interface ApiRequest<T> {
  payload: T;
  timestamp: Date;
  requestId: string;
}
