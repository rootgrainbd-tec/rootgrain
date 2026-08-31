export enum StorageProvider {
  VERCEL_BLOB = "VERCEL_BLOB",
}

export enum UploadContext {
  CUSTOM_REQUEST_ITEM_IMAGE = "CUSTOM_REQUEST_ITEM_IMAGE",
}

export interface UploadOptions {
  contentType?: string;
  access?: "public" | "private";
  metadata?: Record<string, string>;
}

export interface BlobMetadata {
  size: number;
  uploadedAt: Date;
  pathname: string;
  url: string;
  contentType: string;
  contentDisposition?: string;
}

export class StorageError extends Error {
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(code: string, message: string, originalError?: unknown) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.originalError = originalError;
  }
}

export const StorageErrorCodes = {
  UPLOAD_FAILED: "STORAGE_UPLOAD_FAILED",
  NOT_FOUND: "STORAGE_NOT_FOUND",
  DELETE_FAILED: "STORAGE_DELETE_FAILED",
  METADATA_FAILED: "STORAGE_METADATA_FAILED",
  SIGNING_FAILED: "STORAGE_SIGNING_FAILED",
  INVALID_INPUT: "STORAGE_INVALID_INPUT",
} as const;
