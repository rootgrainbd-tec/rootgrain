function assertDataset(): string {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const envId = process.env.NEXT_PUBLIC_ENVIRONMENT_ID;

  if (envId === "staging") {
    if (dataset !== "staging") {
      throw new Error(`FATAL: Staging environment requires NEXT_PUBLIC_SANITY_DATASET="staging", but got "${dataset}"`);
    }
    return dataset;
  }

  if (dataset === "staging") {
    if (envId !== "staging") {
      throw new Error(`FATAL: Dataset "staging" requires NEXT_PUBLIC_ENVIRONMENT_ID="staging" to prevent accidental cross-wiring.`);
    }
  }

  if (dataset && dataset !== "production" && dataset !== "development") {
    throw new Error(`FATAL: Unknown dataset configured: "${dataset}". Must be production, staging, or development.`);
  }

  return dataset || "production";
}

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01'

export const dataset = assertDataset()
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "uuu315g5"
export const useCdn = true

