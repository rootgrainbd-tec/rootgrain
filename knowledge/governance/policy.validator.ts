import { KnowledgePolicy } from './knowledge.policy';
import { DocumentationPolicy } from './documentation.policy';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class PolicyValidator {
  static validateKnowledgePolicy(policy: KnowledgePolicy): void {
     if (!policy.policy_id) throw KnowledgeException.validation("Knowledge policy missing identifiers");
  }

  static validateDocumentationPolicy(policy: DocumentationPolicy): void {
     if (!policy.policy_id) throw KnowledgeException.validation("Documentation policy missing identifiers");
  }
}
