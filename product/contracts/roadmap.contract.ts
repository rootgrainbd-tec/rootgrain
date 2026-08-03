import { PriorityLevel } from './feature.contract';

export interface RoadmapContract {
  readonly roadmap_id: string;
  readonly objective: string;
  readonly impact_score: number;
  readonly effort_score: number;
  readonly priority_level: PriorityLevel;
}
