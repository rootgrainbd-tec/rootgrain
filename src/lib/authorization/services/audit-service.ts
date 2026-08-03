import { IAuditService } from "../contracts/audit-service";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import crypto from "crypto";

export interface IAuditRepository {
  getLastEventHash(userId: string): Promise<string | null>;
  saveLog(logEntry: any): Promise<void>;
}

export class AuditService implements IAuditService {
  constructor(private auditRepo: IAuditRepository) {}

  async log(context: AuthorizationContext, decision: AuthorizationDecision): Promise<void> {
    if (!decision.auditRequired) return;

    const payload = JSON.stringify({
      userId: context.userId,
      principal: context.principal,
      resource: decision.resource,
      action: decision.action,
      allowed: decision.allowed,
      timestamp: context.timestamp.toISOString(),
    });

    const eventHash = crypto.createHash("sha256").update(payload).digest("hex");

    let previousEventHash = null;

    if (context.userId) {
      previousEventHash = await this.auditRepo.getLastEventHash(context.userId);
    }

    const logEntry = {
      userId: context.userId,
      action: decision.action,
      resource: decision.resource,
      principal: context.principal,
      decision: decision.allowed ? "ALLOW" : decision.effect,
      eventHash,
      previousEventHash,
      metadata: {
        ipAddress: context.ipAddress,
        requestId: context.requestId,
        reason: decision.reason,
      },
    };

    await this.auditRepo.saveLog(logEntry);
  }
}
