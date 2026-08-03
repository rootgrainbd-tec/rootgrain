import { GovernanceContext } from '../governance/governance.context';
import { QualityRule } from '../quality/quality.rule';
import { ReportContract } from '../reporting/report.contract';
import { DataException } from '../exceptions/data.exception';

export class DataRegistry {
  private static contexts = new Map<string, GovernanceContext>();
  private static rules = new Map<string, QualityRule>();
  private static reports = new Map<string, ReportContract>();

  static registerGovernance(context: GovernanceContext): void {
     if (this.contexts.has(context.governance_id)) throw DataException.validation("Duplicate Governance ID");
     this.contexts.set(context.governance_id, context);
  }

  static registerQualityRule(rule: QualityRule): void {
     if (this.rules.has(rule.rule_id)) throw DataException.validation("Duplicate Quality Rule ID");
     this.rules.set(rule.rule_id, rule);
  }

  static registerReport(report: ReportContract): void {
     if (this.reports.has(report.report_id)) throw DataException.validation("Duplicate Report ID");
     this.reports.set(report.report_id, report);
  }
}
