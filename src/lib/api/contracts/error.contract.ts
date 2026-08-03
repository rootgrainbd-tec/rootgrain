export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ErrorContract {
  code: string;
  message: string;
  details: ApiErrorDetail[];
  timestamp: string;
}
