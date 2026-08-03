import { KnowledgeInsight } from './knowledge.insight';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class IntelligenceValidator {
  static validate(insight: KnowledgeInsight): void {
     if (!insight.insight_id || !insight.knowledge_id) {
        throw KnowledgeException.validation("Insight missing structural linkage");
     }
  }
}
