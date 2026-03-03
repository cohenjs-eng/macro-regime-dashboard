// pages/index.js
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const PORTFOLIO = {
  totalValue: 266025, totalCash: 50623, cashPct: 19.0,
  holdings: {
    GOOGL: { val: 29929, pct: 11.3, cat: "conviction" },
    NVDA: { val: 14060, pct: 5.3, cat: "conviction" },
    COST: { val: 6065, pct: 2.3, cat: "conviction" },
    PLTR: { val: 4527, pct: 1.7, cat: "conviction" },
    GDX: { val: 17450, pct: 6.6, cat: "gold" },
    GLD: { val: 7151, pct: 2.7, cat: "gold" },
    ITOT: { val: 43237, pct: 16.3, cat: "broad" },
    DYNF: { val: 16359, pct: 6.1, cat: "broad" },
    QQQ: { val: 10779, pct: 4.1, cat: "broad" },
  },
};

const SECTORS = [
  { name: "Energy", etf: "XLE", score: 9, signal: "deploy" },
  { name: "Defence", etf: "ITA", score: 8, signal: "deploy" },
  { name: "Gold Miners", etf: "GDX", score: 7, signal: "hold" },
  { name: "Staples", etf: "XLP", score: 7, signal: "deploy" },
  { name: "Utilities", etf: "XLU", score: 6, signal: "accumulate" },
  { name: "Healthcare", etf: "XLV", score: 6, signal: "accumulate" },
  { name: "Infrastructure", etf: "PAVE", score: 5, signal: "wait" },
  { name: "Tech", etf: "QQQ", score: 3, signal: "avoid" },
  { name: "Consumer Disc.", etf: "XLY", score: 2, signal: "avoid" },
];

const TRIGGERS = [
  { cond: "VIX > 35", action: "Deploy dry powder into ITOT/QQQ", urg: "high" },
  { cond: "S&P < 6,200", action: "Accelerate all deployment — Barclays signal", urg: "high" },
  { cond: "GOOGL < $280", action: "Aggressive accumulation", urg: "high" },
  { cond: "Brent < $75", action: "Resume growth deployment", urg: "med" },
  { cond: "PLTR < $100", action: "Begin small tranches", urg: "low" },
  { cond: "Hormuz reopens", action: "Shift defensive → growth", urg: "med" },
];

function getRegime(d) {
  if (!d) return { name: "LOADING", color: "#64748b", action: "" };
  const v = d.vix?.value || 20, o = d.brent?.value || 70;
  if (v > 25 && o > 80) return { name: "RISK-OFF", color: "#ef4444", action: "Cash is king. Defensive sectors only. No growth adds." };
  if (v > 18 || o > 70) return { name: "TRANSITIONAL", color: "#f59e0b", action: "Begin GOOGL + COST tranches. Reserve 30% cash." };
  return { name: "RISK-ON", color: "#22c55e", action: "Full deployment. Resume 4-stock framework." };
}

function getFired(d) {
  if (!d) return [];
  const f = [];
  if (d.vix?.value > 35) f.push("🚨 VIX >35 — DEPLOY DRY POWDER into broad market");
  if (d.spx?.value < 6200) f.push("🚨 S&P <6,200 — BARCLAYS CAPITULATION SIGNAL — accelerate all deployment");
  if (d.googl?.value < 280) f.push("🔥 GOOGL <$280 — AGGRESSIVE ACCUMULATION zone");
  if (d.pltr?.value < 100) f.push("📍 PLTR <$100 — begin small tranches");
  if (d.brent?.value < 75) f.push("✅ Oil <$75 — resume growth deployment");
  return f;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [tab, setTab] = useState("signals");

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // Calls YOUR OWN API route — not Anthropic directly.
      // The API key stays server-side.
      const r = await fetch("/api/market-data", { method: "POST" });
      const result = await r.json();

      if (result.error) {
        setErr(result.error + (result.detail ? ": " + result.detail.substring(0, 200) : ""));
      } else {
        setData(result);
        setUpdated(new Date());
      }
    } catch (e) {
      setErr("Network error: " + e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const regime = getRegime(data);
  const fired = getFired(data);
  const jm = "'JetBrains Mono', monospace";
  const is_ = "'Instrument Sans', -apple-system, sans-serif";

  const indicators = data
    ? [
        { n: "Brent Crude", v: `$${data.brent?.value}`, c: data.brent?.change_pct, sig: data.brent?.value > 85 ? "red" : data.brent?.value > 75 ? "amber" : "green", trig: "<$75 resume growth", i: "🛢️" },
        { n: "VIX", v: data.vix?.value?.toFixed?.(1) || data.vix?.value, c: data.vix?.change_pct, sig: data.vix?.value > 30 ? "red" : data.vix?.value > 20 ? "amber" : "green", trig: ">35 deploy dry powder", i: "📊" },
        { n: "Gold", v: `$${(data.gold?.value || 0).toLocaleString()}`, c: data.gold?.change_pct, sig: "green", trig: "9.2% held — don't chase", i: "🥇" },
        { n: "DXY", v: data.dxy?.value, c: data.dxy?.change_pct, sig: data.dxy?.change_pct > 1 ? "amber" : "green", trig: "Peak reversal → add GOOGL", i: "💵" },
        { n: "S&P 500", v: (data.spx?.value || 0).toLocaleString(), c: data.spx?.change_pct, sig: data.spx?.change_pct < -3 ? "red" : data.spx?.change_pct < -1 ? "amber" : "green", trig: "<6,200 = deploy signal", i: "📉" },
        { n: "10Y Yield", v: `${data.ten_y?.value}%`, c: data.ten_y?.change_pct, sig: "green", trig: "Falling → supports tech", i: "🏛️" },
      ]
    : [];

  const stocks = data
    ? [
        { s: "GOOGL", v: data.googl?.value, c: data.googl?.change_pct, h: 29929, sc: 7, zones: [260, 280, 300, 330], zl: ["Strong Buy", "Buy", "Accumulate", "Hold"] },
        { s: "COST", v: data.cost?.value, c: data.cost?.change_pct, h: 6065, sc: 5, zones: [830, 880, 940, 1020], zl: ["Strong Buy", "Buy", "Accumulate", "Hold"] },
        { s: "NVDA", v: data.nvda?.value, c: data.nvda?.change_pct, h: 14060, sc: 5, zones: [165, 175, 185, 195], zl: ["Strong Buy", "Buy", "Accumulate", "Hold"] },
        { s: "PLTR", v: data.pltr?.value, c: data.pltr?.change_pct, h: 4527, sc: 3, zones: [85, 100, 115, 140], zl: ["Strong Buy", "Buy", "Accumulate", "Hold"] },
      ]
    : [];

  const sigCol = (s) => (s === "red" ? "#ef4444" : s === "amber" ? "#f59e0b" : "#22c55e");
  const sigBg = (s) => (s === "red" ? "#ef444418" : s === "amber" ? "#f59e0b18" : "#22c55e18");
  const sigLbl = (s) => (s === "red" ? "DANGER" : s === "amber" ? "CAUTION" : "OK");

  return (
    <>
      <Head>
        <title>Macro Regime Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0e17; color: #e2e8f0; font-family: 'Instrument Sans', -apple-system, sans-serif; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", padding: 16, maxWidth: 960, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${regime.color}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: regime.color, boxShadow: `0 0 10px ${regime.color}`, animation: "pulse 2s infinite" }} />
                <span style={{ fontFamily: jm, fontSize: 10, color: regime.color, letterSpacing: 2, fontWeight: 700 }}>{regime.name}</span>
                {data?.headline && <span style={{ fontSize: 10, color: "#64748b" }}>— {data.headline}</span>}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Macro Regime Dashboard</h1>
              <p style={{ fontSize: 10, color: "#475569", marginTop: 2, fontFamily: jm }}>
                Portfolio $266K · Cash $50.6K (19%) · Hormuz:{" "}
                <span style={{ color: data?.hormuz === "open" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{data?.hormuz || "..."}</span>
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <button
                onClick={refresh}
                disabled={loading}
                style={{
                  padding: "7px 14px", borderRadius: 6, border: `1px solid ${regime.color}40`,
                  background: `${regime.color}08`, color: regime.color, cursor: loading ? "wait" : "pointer",
                  fontFamily: jm, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {loading && (
                  <span style={{ display: "inline-block", width: 12, height: 12, border: `2px solid ${regime.color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                )}
                {loading ? "Scanning..." : "⟳ Refresh"}
              </button>
              {updated && <span style={{ fontSize: 8, color: "#334155", fontFamily: jm }}>{updated.toLocaleTimeString()}</span>}
            </div>
          </div>
          {regime.action && (
            <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 5, background: `${regime.color}0a`, border: `1px solid ${regime.color}20`, fontSize: 11, color: regime.color }}>
              <strong>Action:</strong> {regime.action}
            </div>
          )}
        </div>

        {/* FIRED TRIGGERS */}
        {fired.map((f, i) => (
          <div key={i} style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 6, background: "#ef44440a", border: "1px solid #ef444420", fontSize: 12, color: "#fca5a5", fontWeight: 600 }}>
            {f}
          </div>
        ))}

        {err && (
          <div style={{ padding: 10, borderRadius: 6, background: "#ef44440f", border: "1px solid #ef444430", marginBottom: 12, fontSize: 11, color: "#fca5a5" }}>
            {err}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: "flex", gap: 3, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { id: "signals", l: "Live Signals" },
            { id: "stocks", l: "Conviction 4" },
            { id: "deploy", l: "Deploy Plan" },
            { id: "scenarios", l: "Scenarios" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "6px 12px", borderRadius: 5, border: "none", cursor: "pointer",
                fontFamily: is_, fontSize: 11, fontWeight: 600,
                background: tab === t.id ? `${regime.color}12` : "#ffffff06",
                color: tab === t.id ? regime.color : "#475569",
                borderBottom: tab === t.id ? `2px solid ${regime.color}` : "2px solid transparent",
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* ═══════ SIGNALS TAB ═══════ */}
        {tab === "signals" && (
          <div>
            {!data && !loading && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Click Refresh to fetch live data</div>}
            {loading && !data && (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 20, height: 20, border: "2px solid #fca5a5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 10px" }} />
                Searching markets...
              </div>
            )}
            {data && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8, marginBottom: 14 }}>
                  {indicators.map((ind) => (
                    <div key={ind.n} style={{ background: "#ffffff04", borderRadius: 8, padding: 12, borderTop: `2px solid ${sigCol(ind.sig)}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{ind.i} {ind.n}</span>
                        <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 8, fontFamily: jm, fontWeight: 700, background: sigBg(ind.sig), color: sigCol(ind.sig) }}>
                          {sigLbl(ind.sig)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: jm }}>{ind.v}</span>
                        <span style={{ fontSize: 11, fontFamily: jm, fontWeight: 600, color: String(ind.c).startsWith("-") ? "#ef4444" : ind.n === "VIX" || ind.n === "Brent Crude" ? (ind.c > 0 ? "#ef4444" : "#22c55e") : "#22c55e" }}>
                          {ind.c > 0 ? "+" : ""}
                          {ind.c}%
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: "#fbbf24", fontFamily: jm, background: "#fbbf240a", padding: "2px 5px", borderRadius: 3, marginTop: 4 }}>▸ {ind.trig}</div>
                    </div>
                  ))}
                </div>

                {/* Regime boxes */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 6, marginBottom: 14 }}>
                  {[
                    { n: "RISK-OFF", c: "VIX>25 & Oil>$80", col: "#ef4444" },
                    { n: "TRANSITIONAL", c: "VIX 18-25 or Oil $70-80", col: "#f59e0b" },
                    { n: "RISK-ON", c: "VIX<18 & Oil<$75", col: "#22c55e" },
                  ].map((r) => {
                    const active = r.n === regime.name;
                    return (
                      <div key={r.n} style={{ padding: 10, borderRadius: 6, background: active ? `${r.col}0c` : "#ffffff03", border: active ? `1px solid ${r.col}35` : "1px solid transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: r.col, boxShadow: `0 0 6px ${r.col}` }} />}
                          <span style={{ fontFamily: jm, fontSize: 10, fontWeight: 700, color: active ? r.col : "#334155" }}>{r.n}</span>
                          {active && <span style={{ fontSize: 7, color: r.col }}>CURRENT</span>}
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", fontFamily: jm, marginTop: 3 }}>{r.c}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Sector scores */}
                <div style={{ background: "#ffffff03", borderRadius: 8, padding: 12 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#94a3b8" }}>Sector Priority</h3>
                  {SECTORS.map((s) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, fontFamily: jm, background: s.score >= 7 ? "#22c55e12" : s.score >= 5 ? "#f59e0b12" : "#ef444412", color: s.score >= 7 ? "#86efac" : s.score >= 5 ? "#fbbf24" : "#fca5a5" }}>
                        {s.score}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, width: 100 }}>{s.name}</span>
                      <span style={{ fontFamily: jm, fontSize: 9, color: "#475569", width: 40 }}>{s.etf}</span>
                      <div style={{ flex: 1, height: 3, background: "#ffffff08", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${s.score * 10}%`, borderRadius: 2, background: s.score >= 7 ? "#22c55e" : s.score >= 5 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, fontFamily: jm, fontWeight: 700, textTransform: "uppercase", width: 70, textAlign: "center", background: s.signal === "deploy" ? "#22c55e12" : s.signal === "accumulate" ? "#f59e0b12" : s.signal === "wait" ? "#64748b12" : "#ef444412", color: s.signal === "deploy" ? "#86efac" : s.signal === "accumulate" ? "#fbbf24" : s.signal === "wait" ? "#94a3b8" : "#fca5a5" }}>
                        {s.signal}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════ STOCKS TAB ═══════ */}
        {tab === "stocks" && (
          <div>
            {!data ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Click Refresh</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
                {stocks.map((st) => (
                  <div key={st.s} style={{ background: "#ffffff04", borderRadius: 8, padding: 14, borderLeft: `3px solid ${st.sc >= 7 ? "#22c55e" : st.sc >= 5 ? "#f59e0b" : "#ef4444"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: jm }}>{st.s}</span>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, fontFamily: jm, background: st.sc >= 7 ? "#22c55e12" : st.sc >= 5 ? "#f59e0b12" : "#ef444412", color: st.sc >= 7 ? "#86efac" : st.sc >= 5 ? "#fbbf24" : "#fca5a5" }}>
                        {st.sc}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: jm }}>${st.v}</span>
                      <span style={{ fontSize: 12, fontFamily: jm, fontWeight: 600, color: st.c < 0 ? "#ef4444" : "#22c55e" }}>
                        {st.c > 0 ? "+" : ""}
                        {st.c}%
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 8 }}>
                      Held: ${st.h.toLocaleString()} ({((st.h / 266025) * 100).toFixed(1)}%)
                    </div>
                    <div style={{ fontSize: 9, color: "#475569", fontFamily: jm, marginBottom: 3 }}>ENTRY ZONES</div>
                    {st.zones.map((z, i) => {
                      const active = st.v <= z;
                      return (
                        <div key={z} style={{ fontSize: 10, fontFamily: jm, color: active ? "#86efac" : "#1e293b", marginBottom: 1 }}>
                          {active ? "●" : "○"} {st.zl[i]} ${z}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ DEPLOY TAB ═══════ */}
        {tab === "deploy" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 6, marginBottom: 14 }}>
              {[
                { l: "DEPLOYABLE", v: "$50,623", s: "19% of portfolio", c: "#22c55e" },
                { l: "DRY POWDER", v: "$15,187", s: "30% reserved", c: "#ef4444" },
                { l: "TAX-ADV CASH", v: "$31,408", s: "Deploy from IRAs first", c: "#f59e0b" },
              ].map((b) => (
                <div key={b.l} style={{ background: `${b.c}08`, borderRadius: 6, padding: 10, borderLeft: `3px solid ${b.c}` }}>
                  <div style={{ fontSize: 8, color: b.c, fontFamily: jm, letterSpacing: 1, fontWeight: 700 }}>{b.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{b.v}</div>
                  <div style={{ fontSize: 9, color: "#475569" }}>{b.s}</div>
                </div>
              ))}
            </div>
            {[
              { n: "Layer 1: Immediate Hedges", t: "This week", a: "$10,125", c: "#ef4444", items: [{ w: "XLE (Energy)", a: "$4,000", y: "Oil beneficiary. 1.2% energy." }, { w: "ITA (Defence)", a: "$3,000", y: "Defence 0.9%. Conflict beneficiary." }, { w: "COST (add)", a: "$3,125", y: "Defensive conviction. Earnings Thu." }] },
              { n: "Layer 2: Defensive Growth", t: "Weeks 2-4", a: "$12,656", c: "#f59e0b", items: [{ w: "GOOGL (add)", a: "$6,000", y: "Highest conviction. If <$300." }, { w: "XLP (Staples)", a: "$3,500", y: "Broad staples. Beta 0.58." }, { w: "XLV (Healthcare)", a: "$3,156", y: "Zero healthcare. Defensive." }] },
              { n: "Layer 3: Opportunistic", t: "Weeks 4-10", a: "$12,656", c: "#3b82f6", items: [{ w: "GOOGL tranche 2", a: "$5,000", y: "If S&P -7% & GOOGL <$290." }, { w: "NVDA (conditional)", a: "$4,000", y: "If narrative stabilises." }, { w: "COST / PLTR", a: "$3,656", y: "PLTR only <$100." }] },
              { n: "Layer 4: Dry Powder", t: "Hold", a: "$15,187", c: "#475569", items: [{ w: "CASH — do not deploy", a: "$15,187", y: "VIX >35 or S&P -10% triggers." }] },
            ].map((l, i) => (
              <div key={i} style={{ background: "#ffffff03", borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `3px solid ${l.c}`, opacity: i === 3 ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{l.n}</span>
                    <span style={{ fontSize: 10, color: "#475569", marginLeft: 8 }}>{l.t}</span>
                  </div>
                  <span style={{ fontFamily: jm, fontSize: 12, fontWeight: 700 }}>{l.a}</span>
                </div>
                {l.items.map((it, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: j ? "1px solid #ffffff06" : "none" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{it.w}</div>
                      <div style={{ fontSize: 9, color: "#475569" }}>{it.y}</div>
                    </div>
                    <span style={{ fontFamily: jm, fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>{it.a}</span>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ background: "#ffffff03", borderRadius: 8, padding: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>Deploy Triggers</h3>
              {TRIGGERS.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: i < TRIGGERS.length - 1 ? "1px solid #ffffff06" : "none" }}>
                  <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 2, fontWeight: 700, fontFamily: jm, background: t.urg === "high" ? "#ef444412" : t.urg === "med" ? "#f59e0b12" : "#64748b12", color: t.urg === "high" ? "#fca5a5" : t.urg === "med" ? "#fbbf24" : "#94a3b8", textTransform: "uppercase" }}>
                    {t.urg}
                  </span>
                  <span style={{ fontFamily: jm, fontSize: 10, fontWeight: 600, minWidth: 110 }}>{t.cond}</span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>→ {t.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ SCENARIOS TAB ═══════ */}
        {tab === "scenarios" && (
          <div>
            {[
              { n: "Swift Resolution", p: "25%", o: "$70-75", s: "6,900-7,200", vi: "15-18", act: "Deploy 60% cash into GOOGL + COST within 2 weeks.", c: "#22c55e", imp: "+2-5%", d: "+$5k-13k", desc: "Ceasefire 2 weeks. Hormuz reopens. Oil reverts." },
              { n: "Contained Conflict", p: "45%", o: "$80-95", s: "6,500-6,800", vi: "22-30", act: "Deploy 30% into defensive sectors. Hold rest.", c: "#f59e0b", imp: "-3-7%", d: "-$8k-19k", desc: "Strikes 4-8 weeks. Hormuz partially reopens." },
              { n: "Prolonged Escalation", p: "30%", o: "$100+", s: "6,000-6,400", vi: "35+", act: "Stay defensive. GOOGL/COST only at strong buy levels. VIX >35 = broad market buy.", c: "#ef4444", imp: "-10-18%", d: "-$27k-48k", desc: "Regional war. Hormuz blocked months. Stagflation." },
            ].map((sc, i) => (
              <div key={i} style={{ background: `${sc.c}06`, borderRadius: 8, padding: 14, marginBottom: 8, border: `1px solid ${sc.c}18` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${sc.c}15`, color: sc.c, fontSize: 12, fontWeight: 800, fontFamily: jm }}>
                      {sc.p}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sc.c }}>{sc.n}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{sc.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: jm }}>{sc.imp}</div>
                    <div style={{ fontSize: 10, fontFamily: jm, color: "#475569" }}>{sc.d}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginBottom: 6 }}>
                  {[{ l: "Oil", v: sc.o }, { l: "S&P", v: sc.s }, { l: "VIX", v: sc.vi }].map((m) => (
                    <div key={m.l} style={{ background: "#00000030", borderRadius: 3, padding: 4 }}>
                      <div style={{ fontSize: 7, color: "#334155", fontFamily: jm }}>{m.l}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: jm }}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#00000020", borderRadius: 3, padding: 6 }}>
                  <div style={{ fontSize: 8, color: sc.c, fontFamily: jm, fontWeight: 700, marginBottom: 2 }}>YOUR ACTION</div>
                  <div style={{ fontSize: 11, lineHeight: 1.4 }}>{sc.act}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14, padding: "8px 0", borderTop: "1px solid #ffffff06" }}>
          <p style={{ fontSize: 8, color: "#1e293b" }}>Live data via web search. Portfolio from Feb 28 Fidelity statements. Not financial advice. Regime auto-classifies on VIX + Oil.</p>
        </div>
      </div>
    </>
  );
}
