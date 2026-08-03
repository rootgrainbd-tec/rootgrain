import { ProductContract } from '../contracts/product.contract';
import { FeatureContract } from '../contracts/feature.contract';
import { RoadmapContract } from '../contracts/roadmap.contract';
import { ProductException } from '../exceptions/product.exception';

export class ProductRegistry {
  private static products = new Map<string, ProductContract>();
  private static features = new Map<string, FeatureContract>();
  private static roadmaps = new Map<string, RoadmapContract>();

  static registerProduct(product: ProductContract): void {
      if (this.products.has(product.product_id)) throw ProductException.validation("Duplicate Product ID in Registry");
      this.products.set(product.product_id, product);
  }

  static registerFeature(feature: FeatureContract): void {
      if (this.features.has(feature.feature_id)) throw ProductException.validation("Duplicate Feature ID in Registry");
      this.features.set(feature.feature_id, feature);
  }

  static registerRoadmap(roadmap: RoadmapContract): void {
      if (this.roadmaps.has(roadmap.roadmap_id)) throw ProductException.validation("Duplicate Roadmap ID in Registry");
      this.roadmaps.set(roadmap.roadmap_id, roadmap);
  }
}
