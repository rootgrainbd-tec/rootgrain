import { IStorageAdapter } from "./storage-adapter.interface";
import { VercelBlobAdapter } from "./vercel-blob.adapter";
import { StorageProvider } from "./storage.types";

// Maintain a singleton instance of the adapter to avoid recreating it
let storageAdapterInstance: IStorageAdapter | null = null;

/**
 * Returns the active storage adapter for the application.
 * Currently configured to VERCEL_BLOB as per ADR 0136.
 */
export function getStorageAdapter(provider: StorageProvider = StorageProvider.VERCEL_BLOB): IStorageAdapter {
  if (storageAdapterInstance) {
    return storageAdapterInstance;
  }

  if (provider === StorageProvider.VERCEL_BLOB) {
    storageAdapterInstance = new VercelBlobAdapter();
    return storageAdapterInstance;
  }

  throw new Error(`Storage provider ${provider} is not supported.`);
}
