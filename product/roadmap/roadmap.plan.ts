import { RoadmapContract } from '../contracts/roadmap.contract';

export interface RoadmapPlan {
  readonly plan_id: string;
  readonly product_id: string;
  readonly items: ReadonlyArray<RoadmapContract>;
  readonly version: string;
}
