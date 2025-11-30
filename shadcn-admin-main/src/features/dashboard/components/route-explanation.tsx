// RouteExplanation.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function RouteExplanation({
  origin = "India",
  destination = "United States",
  amount_musd = 500,
  weights = { cost: 0.6, speed: 0.2, risk: 0.2 },
  route = null
}) {
  const [resp, setResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchExplanation() {
      setLoading(true);
      setError(null);
      try {
        const API_URL = "http://localhost:8000/api/route/explain"; // use proxy or full URL http://localhost:8000/route/explain
        const payload = { origin, destination, amount_musd, weights, route };
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server ${res.status}: ${text}`);
        }
        const json = await res.json();
        if (mounted) setResp(json);
      } catch (e) {
        console.error(e);
        if (mounted) setError(e.message || "Failed to fetch explanation");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchExplanation();
    return () => { mounted = false; };
  }, [origin, destination, amount_musd, weights, route]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Why this Route Fits
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            {loading && <div>Computing route explanation…</div>}
            {error && <div className="text-red-500">Error: {error}</div>}

            {!loading && !error && resp && (
              <>
                <p>
                  The <strong className="text-foreground">{resp.route.join(" → ")}</strong> route was selected based on
                  your weights (Cost: {Math.round(weights.cost*100)}%, Speed: {Math.round(weights.speed*100)}%, Risk: {Math.round(weights.risk*100)}%).
                </p>

                <div className="space-y-2 pl-4 border-l-2 border-blue-500/30">
                  {resp.bullets.map((b, i) => <p key={i}>{b}</p>)}
                </div>

                <div className="pt-3">
                  <h4 className="text-xs font-medium text-muted-foreground">Route summary</h4>
                  <ul className="mt-2 text-xs space-y-1">
                    <li><strong>Total cost: </strong>{resp.total_cost_pct}%</li>
                    <li><strong>Total settlement time: </strong>{resp.total_time_days} days</li>
                    <li><strong>Total friction score: </strong>{resp.total_friction}</li>
                    {resp.savings_vs_direct_pct !== null && <li><strong>Estimated savings vs direct: </strong>{resp.savings_vs_direct_pct}</li>}
                  </ul>
                </div>

                <div className="pt-3">
                  <h4 className="text-xs font-medium text-muted-foreground">Per-edge breakdown</h4>
                  <div className="mt-2 grid gap-2">
                    {resp.edges.map((edge, idx) => (
                      <div key={idx} className="p-2 rounded-md bg-surface/50">
                        <div className="text-xs font-semibold">{edge.frm} → {edge.to}</div>
                        <div className="text-xs">Cost: {edge.cost_pct}% · Time: {edge.time_days}d · Friction: {edge.friction}</div>
                        <div className="mt-1 text-xs">
                          <div className="font-medium">Top contributions:</div>
                          <ul className="ml-3 list-disc">
                            {Object.entries(edge.contributions).map(([k,v]) => (
                              <li key={k}>{k.replace(/_/g," ")}: {Number(v).toFixed(4)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!loading && !error && !resp && <div>No explanation available.</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
