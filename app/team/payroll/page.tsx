"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";
import { ComingSoonButton } from "@/components/ComingSoon";
import { Toast } from "@/components/Toast";

interface Contract {
  id: string;
  user_email: string;
  user_name: string | null;
  role: string | null;
  department: string | null;
  gross_monthly: number | null;
  kra_pin: string | null;
}

// ──────── Kenyan tax computation (2025 rates) ────────
function computePaye(gross: number) {
  // Bands (monthly):
  // 0 – 24,000     : 10%
  // 24,001 – 32,333: 25%
  // 32,334 – 500,000: 30%
  // 500,001 – 800,000: 32.5%
  // > 800,000       : 35%
  // Personal relief: KSh 2,400 / month
  let taxable = gross;
  let tax = 0;

  const bands = [
    { limit: 24000, rate: 0.1 },
    { limit: 8333, rate: 0.25 }, // 24001–32333
    { limit: 467667, rate: 0.3 }, // 32334–500000
    { limit: 300000, rate: 0.325 }, // 500001–800000
    { limit: Infinity, rate: 0.35 },
  ];

  for (const b of bands) {
    if (taxable <= 0) break;
    const slice = Math.min(taxable, b.limit);
    tax += slice * b.rate;
    taxable -= slice;
  }

  // Personal relief
  tax = Math.max(0, tax - 2400);
  return Math.round(tax);
}

function computeNssf(gross: number) {
  // Tier I + Tier II — simplified to 6% capped at KSh 6,960 (Tier I cap KSh 8,000 + Tier II cap KSh 72,000)
  const tier1Base = Math.min(gross, 8000);
  const tier2Base = Math.max(0, Math.min(gross, 72000) - 8000);
  const contribution = tier1Base * 0.06 + tier2Base * 0.06;
  return Math.round(contribution);
}

function computeShif(gross: number) {
  // SHIF: 2.75% of gross
  return Math.round(gross * 0.0275);
}

function computeHousingLevy(gross: number) {
  // Housing levy: 1.5% of gross
  return Math.round(gross * 0.015);
}

export default function PayrollPage() {
  const { isApprover, userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [editingPayslip, setEditingPayslip] = useState<any>(null);

  const load = async () => {
    const [c, p] = await Promise.all([
      supabase.from("staff_contracts").select("*"),
      supabase
        .from("payslips")
        .select("*")
        .eq("period_month", period.month)
        .eq("period_year", period.year),
    ]);
    setContracts((c.data as Contract[]) || []);
    setPayslips(p.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [period]);

  const computePayroll = (gross: number) => {
    const paye = computePaye(gross);
    const nssf = computeNssf(gross);
    const shif = computeShif(gross);
    const housing = computeHousingLevy(gross);
    const net = gross - paye - nssf - shif - housing;
    return { paye, nssf, shif, housing, net };
  };

  const generatePayslip = async (contract: Contract) => {
    if (!contract.gross_monthly) {
      showToast("Set gross salary first in the contract");
      return;
    }
    const c = computePayroll(contract.gross_monthly);
    const { error } = await supabase.from("payslips").upsert(
      {
        user_email: contract.user_email,
        period_month: period.month,
        period_year: period.year,
        gross: contract.gross_monthly,
        paye: c.paye,
        nssf: c.nssf,
        shif: c.shif,
        housing_levy: c.housing,
        net_pay: c.net,
        status: "draft",
      },
      { onConflict: "user_email,period_month,period_year" }
    );
    if (error) return showToast("Error: " + error.message);
    load();
    showToast("Payslip generated ✓");
  };

  const generateAll = async () => {
    for (const c of contracts) {
      if (c.gross_monthly) await generatePayslip(c);
    }
    load();
    showToast("All payslips generated");
  };

  const markPaid = async (id: string) => {
    await supabase
      .from("payslips")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);
    setPayslips((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "paid" } : p))
    );
    showToast("Marked paid ✓");
  };

  const monthName = new Date(period.year, period.month - 1, 1).toLocaleDateString(
    "en-KE",
    { month: "long", year: "numeric" }
  );

  if (loading) return null;

  if (!isApprover) {
    return (
      <div className="panel" style={{ marginTop: 0 }}>
        <EmptyState
          dark
          icon="🔒"
          title="Approver access only"
          description="Payroll is visible only to the chair and co-chair."
        />
      </div>
    );
  }

  const totalGross = payslips.reduce((a, p) => a + Number(p.gross || 0), 0);
  const totalNet = payslips.reduce((a, p) => a + Number(p.net_pay || 0), 0);
  const totalDeductions = payslips.reduce(
    (a, p) =>
      a +
      Number(p.paye || 0) +
      Number(p.nssf || 0) +
      Number(p.shif || 0) +
      Number(p.housing_levy || 0),
    0
  );

  return (
    <div>
      <div
        className="panel"
        style={{
          marginTop: 0,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: ".82rem", color: "rgba(255,255,255,.65)" }}>
            Period:
          </label>
          <select
            value={period.month}
            onChange={(e) =>
              setPeriod({ ...period, month: Number(e.target.value) })
            }
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#fff",
              fontSize: ".82rem",
              fontFamily: "inherit",
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i, 1).toLocaleDateString("en-KE", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={period.year}
            onChange={(e) =>
              setPeriod({ ...period, year: Number(e.target.value) })
            }
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#fff",
              fontSize: ".82rem",
              fontFamily: "inherit",
            }}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-lime" onClick={generateAll}>
          ⚙ Generate all payslips
        </button>
      </div>

      <div className="kpi-grid" style={{ marginTop: 20 }}>
        <div className="kpi">
          <span>Payslips</span>
          <b>{payslips.length}</b>
          <small>{monthName}</small>
        </div>
        <div className="kpi">
          <span>Total gross</span>
          <b>KSh {(totalGross / 1000).toFixed(1)}K</b>
        </div>
        <div className="kpi">
          <span>Total deductions</span>
          <b>KSh {(totalDeductions / 1000).toFixed(1)}K</b>
          <small className="down">PAYE + NSSF + SHIF + Housing</small>
        </div>
        <div className="kpi">
          <span>Net to pay</span>
          <b style={{ color: "#a3e635" }}>KSh {(totalNet / 1000).toFixed(1)}K</b>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="panel" style={{ marginTop: 20 }}>
          <EmptyState
            dark
            icon="💰"
            title="No staff contracts yet"
            description="Add a contract in the Team page first, then come back here to generate payslips."
          />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 20, padding: 0 }}>
          <div style={{ padding: "20px 22px 8px" }}>
            <h3 style={{ margin: 0 }}>💵 {monthName} payroll</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Gross</th>
                  <th>PAYE</th>
                  <th>NSSF</th>
                  <th>SHIF</th>
                  <th>Housing</th>
                  <th>Net pay</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const slip = payslips.find((p) => p.user_email === c.user_email);
                  const preview = c.gross_monthly
                    ? computePayroll(c.gross_monthly)
                    : null;
                  const p = slip || preview;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#fff" }}>
                          {c.user_name || c.user_email}
                        </div>
                        <small style={{ color: "rgba(255,255,255,.5)" }}>
                          {c.role || "member"}
                        </small>
                      </td>
                      <td style={{ fontSize: ".85rem" }}>
                        {p ? `KSh ${Number(p.gross || c.gross_monthly || 0).toLocaleString()}` : "---"}
                      </td>
                      <td style={{ fontSize: ".82rem", color: "#f87171" }}>
                        {p?.paye ? `KSh ${p.paye.toLocaleString()}` : "---"}
                      </td>
                      <td style={{ fontSize: ".82rem", color: "#f87171" }}>
                        {p?.nssf ? `KSh ${p.nssf.toLocaleString()}` : "---"}
                      </td>
                      <td style={{ fontSize: ".82rem", color: "#f87171" }}>
                        {p?.shif ? `KSh ${p.shif.toLocaleString()}` : "---"}
                      </td>
                      <td style={{ fontSize: ".82rem", color: "#f87171" }}>
                        {p?.housing ? `KSh ${p.housing.toLocaleString()}` : "---"}
                      </td>
                      <td style={{ fontSize: ".9rem", color: "#a3e635", fontWeight: 600 }}>
                        {p?.net || p?.net_pay
                          ? `KSh ${Number(p.net || p.net_pay).toLocaleString()}`
                          : "---"}
                      </td>
                      <td>
                        {slip ? (
                          <span
                            className={`urgency-strip ${
                              slip.status === "paid" ? "urgency-soon" : "urgency-today"
                            }`}
                            style={{
                              background:
                                slip.status === "paid" ? "rgba(163,230,53,.2)" : undefined,
                              color: slip.status === "paid" ? "#a3e635" : undefined,
                            }}
                          >
                            {slip.status}
                          </span>
                        ) : (
                          <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.4)" }}>
                            Preview
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {!slip && c.gross_monthly && (
                            <button
                              className="btn btn-lime"
                              style={{ padding: "4px 10px", fontSize: ".65rem" }}
                              onClick={() => generatePayslip(c)}
                            >
                              Generate
                            </button>
                          )}
                          {slip && slip.status !== "paid" && (
                            <button
                              className="btn btn-green"
                              style={{ padding: "4px 10px", fontSize: ".65rem" }}
                              onClick={() => markPaid(slip.id)}
                            >
                              Mark paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 22,
          padding: 20,
          background: "rgba(217,164,65,.08)",
          border: "1px solid rgba(217,164,65,.25)",
          borderRadius: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <b style={{ color: "#fbbf24", display: "block", marginBottom: 4 }}>
            📤 Automated bank/M-Pesa disbursement
          </b>
          <small style={{ color: "rgba(255,255,255,.65)", fontSize: ".82rem" }}>
            Export payslips as PDF and disburse via bank or M-Pesa B2C — coming
            soon.
          </small>
        </div>
        <ComingSoonButton
          feature="Automated disbursement"
          description="One-click salary payout via M-Pesa B2C or bank file export. Requires Daraja production credentials."
          className="btn btn-lime"
          label="Enable payouts"
        />
      </div>

      <Toast message={toastMsg} />
    </div>
  );
}