// Standard API Response Envelope matching API_SPEC.md

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
    processingTimeMs?: number;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  recommendation?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  meta?: {
    timestamp: string;
    version: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
}
