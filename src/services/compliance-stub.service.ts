/**
 * Placeholder for investor eligibility, jurisdiction checks, and transfer policy.
 * Wire to your CRM, on-chain allowlists, or identity providers.
 */
export type ComplianceDecision = "allow" | "deny" | "manual_review";

export interface ComplianceCheckInput {
  /** Wallet subject to screening */
  wallet: string;
  /** Optional mint involved in the action */
  mint?: string;
  /** High-level action label */
  action: "mint" | "transfer" | "trade" | "redeem";
}

export async function evaluateComplianceStub(
  input: ComplianceCheckInput,
): Promise<{ decision: ComplianceDecision; reason: string }> {
  void input;
  return {
    decision: "allow",
    reason: "stub_always_allow",
  };
}
