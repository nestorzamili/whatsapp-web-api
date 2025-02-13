export interface BulkMessageRequest {
  clientId: string;
  message: string;
  numbers: string[];
  imageUrl?: string;
  caption?: string;
}

export interface BatchProcessResult {
  success: string[];
  failed: Array<{
    number: string;
    error: string;
  }>;
  invalid: string[]; // numbers not registered on WhatsApp
}
