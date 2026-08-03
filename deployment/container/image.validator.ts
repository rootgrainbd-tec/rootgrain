import { ContainerContract } from './container.contract';
import { ImageManifest } from './image.manifest';

export class ImageValidator {
  static validateContract(contract: ContainerContract): void {
     if (!contract.image_id || !contract.image_version || !contract.base_image) {
        throw new Error("Container contract missing required identifiers");
     }
  }

  static validateManifest(manifest: ImageManifest): void {
     if (!manifest.checksum) {
        throw new Error("Image manifest missing checksum validation");
     }
  }
}
