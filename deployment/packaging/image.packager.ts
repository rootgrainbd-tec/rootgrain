import { ContainerContract } from '../container/container.contract';
import { ImageManifest } from '../container/image.manifest';
import { ImageValidator } from '../container/image.validator';

export class ImagePackager {
  static packageImage(contract: ContainerContract): ImageManifest {
     ImageValidator.validateContract(contract);
     return {
        image_id: contract.image_id,
        image_version: contract.image_version,
        checksum: 'sha256:img-dummy',
        build_timestamp: Date.now()
     };
  }
}
