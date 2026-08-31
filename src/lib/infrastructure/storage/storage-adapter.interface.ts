import { BlobMetadata, UploadOptions } from "./storage.types";

export interface IStorageAdapter {
  /**
   * Uploads a file directly from the server.
   * Note: For client uploads, use the handleUpload API route instead.
   */
  upload(
    file: Buffer | ReadableStream | Blob | string,
    storageKey: string,
    options?: UploadOptions
  ): Promise<string>;

  /**
   * Downloads a file into a Buffer.
   */
  download(storageKey: string): Promise<Buffer>;

  /**
   * Generates a short-lived signed URL for accessing private objects.
   */
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Retrieves metadata for a stored object.
   */
  getMetadata(storageKey: string): Promise<BlobMetadata>;

  /**
   * Deletes a stored object.
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Checks if a stored object exists.
   */
  exists(storageKey: string): Promise<boolean>;
}
