import { PipelineContract } from './pipeline.contract';
import { ArtifactContract } from './artifact.contract';

export class PipelineValidator {
  static validatePipeline(pipeline: PipelineContract): void {
     if (!pipeline.pipeline_id || !pipeline.execution_id) {
       throw new Error('Pipeline contract invalid');
     }
  }

  static validateArtifact(artifact: ArtifactContract): void {
     if (!artifact.checksum || !artifact.storage_uri) {
       throw new Error('Artifact contract invalid: Missing checksum or URI');
     }
  }
}
