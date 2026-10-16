import { describe, expect, it } from "vitest";
import { netOf, totals, type Tx } from "./omni";

const tx = (p: Partial<Tx>): Tx => ({
  id: "1", ref: "TX", category: "marketplace", state_code: "CA", platform: "x", description: "", tx_date: "2026-01-01",
  gross: 1000, expenses: 200, commission: 100, refunds: 50, net: 650, payment_status: "paid", completion_status: "completed",
  source: "manual", is_demo: false, created_by: null, created_at: "", updated_at: "", ...p,
});

describe("net profit", () => {
  it("subtracts expenses, commission and refunds once each", () => {
    expect(netOf(tx({}))).toBe(650);
  });
  it("totals pending payments only from pending rows", () => {
    const t = totals([tx({}), tx({ payment_status: "pending", gross: 300, expenses: 0, commission: 0, refunds: 0 })]);
    expect(t.net).toBe(950);
    expect(t.pending).toBe(300);
    expect(t.completed).toBe(2);
  });
});
