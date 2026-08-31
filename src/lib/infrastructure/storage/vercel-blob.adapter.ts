import { del, head, put, issueSignedToken, presignUrl } from "@vercel/blob";
import { IStorageAdapter } from "./storage-adapter.interface";
import { BlobMetadata, StorageError, StorageErrorCodes, UploadOptions } from "./storage.types";

export class VercelBlobAdapter implements IStorageAdapter {
  async upload(
    file: Buffer | ReadableStream | Blob | string,
    storageKey: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const result = await put(storageKey, file, {
        access: "private", // Must be private to match store configuration and security requirements
        contentType: options?.contentType,
      });
      // We return the pathname (our storageKey) to be stored in the DB, not the full URL.
      // This decouples the domain from Vercel's host structure.
      return result.pathname;
    } catch (error: any) {
      console.error("Vercel Blob upload failed:", error.message || error);
      throw new StorageError(
        StorageErrorCodes.UPLOAD_FAILED,
        `Vercel Blob upload failed for key: ${storageKey}`,
        error
      );
    }
  }
  async download(storageKey: string): Promise<Buffer> {
    try {
      const url = await this.getSignedUrl(storageKey);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error("Vercel Blob download failed:", error.message || error);
      throw new StorageError(
        StorageErrorCodes.NOT_FOUND,
        `Vercel Blob download failed for key: ${storageKey}`,
        error
      );
    }
  }
  async getSignedUrl(storageKey: string, expiresInSeconds: number = 300): Promise<string> {
    try {
      // For private stores, we must generate a short-lived signed URL
      const token = await issueSignedToken({
        pathname: storageKey,
        validUntil: Date.now() + expiresInSeconds * 1000,
        operations: ["get"]
      });
      
      const { presignedUrl } = await presignUrl(token, {
        operation: 'get',
        access: 'private',
        pathname: storageKey
      } as any); // Cast as any because @vercel/blob types currently miss this required property
      
      return presignedUrl;
    } catch (error) {
      throw new StorageError(
        StorageErrorCodes.SIGNING_FAILED,
        `Failed to generate access URL for key: ${storageKey}`,
        error
      );
    }
  }

  async getMetadata(storageKey: string): Promise<BlobMetadata> {
    try {
      const meta = await head(storageKey);
      return {
        size: meta.size,
        uploadedAt: meta.uploadedAt,
        pathname: meta.pathname,
        url: meta.url,
        contentType: meta.contentType,
        contentDisposition: meta.contentDisposition,
      };
    } catch (error: any) {
      if (error?.message?.includes("BlobNotFoundError") || error?.name === "BlobNotFoundError") {
        throw new StorageError(
          StorageErrorCodes.NOT_FOUND,
          `Object not found: ${storageKey}`,
          error
        );
      }
      throw new StorageError(
        StorageErrorCodes.METADATA_FAILED,
        `Failed to retrieve metadata for key: ${storageKey}`,
        error
      );
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await del(storageKey);
    } catch (error) {
      throw new StorageError(
        StorageErrorCodes.DELETE_FAILED,
        `Failed to delete object: ${storageKey}`,
        error
      );
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await head(storageKey);
      return true;
    } catch (error: any) {
      // Vercel Blob throws BlobNotFoundError if it doesn't exist
      if (error?.message?.includes("BlobNotFoundError") || error?.name === "BlobNotFoundError") {
        return false;
      }
      // Re-throw other errors (e.g. network failure, auth failure)
      throw new StorageError(
        StorageErrorCodes.METADATA_FAILED,
        `Error checking existence for key: ${storageKey}`,
        error
      );
    }
  }
}
