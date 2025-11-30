// ui/components/optimal-route-card.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, Shield, Wallet, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { getCountryFlag } from "./country-flags";

interface OptimalRouteCardProps {
  source?: string;
  destination?: string;
  amount?: number; // in rupees (or whichever base your UI uses)
  weights?: { cost?: number; time?: number; risk?: number };
  apiBase?: string;
  directLoss?: number;
}

export function OptimalRouteCard({
  source = "India",
  destination = "United States",
  amount = 500000000, // default 500 million (example)
  weights = { cost: 0.6, time: 0.2, risk: 0.2 },
  apiBase = import.meta.env.VITE_PUBLIC_API_BASE || "http://localhost:8000",
  directLoss = 3.8
}: OptimalRouteCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<any | null>(null);

  // Fallback demo route (keeps UI working if API fails)
  const demoRoute = {
    title: "Optimal",
    net: "₹489cr",
    friction: "2.1%",
    time: "1.5d",
    risk: 3,
    path: ["IN", "SG", "US"],
    savings: "+₹8.5cr",
    type: "optimal" as const,
  };

  const formatNetDisplay = (total_cost_pct: number | undefined) => {
    if (!amount || total_cost_pct === undefined || Number.isNaN(total_cost_pct)) {
      return demoRoute.net;
    }
    // compute net received assuming percent cost on amount
    const netReceived = amount * (1 - Number(total_cost_pct) / 100.0);
    // show in crores for better readability
    return `₹${(netReceived / 1e7).toFixed(2)}cr`;
  };

  const fetchRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        source,
        destination,
        amount,
        weights: {
          cost: weights.cost ?? 0.6,
          time: weights.time ?? 0.2,
          risk: weights.risk ?? 0.2,
        },
        k: 3,
        max_hops: 3,
      };

      const resp = await axios.post(`${apiBase}/api/compute-route`, payload, { timeout: 20000 });
      const data = resp.data;

      // Expect response: { source, destination, amount, results: [...] }
      const results = Array.isArray(data?.results) ? data.results : [];

      if (results.length === 0) {
        setError("No routes returned");
        setRoute(null);
        return;
      }

      // assume results are sorted best-first; otherwise sort by composite_score low->high
      const sorted = results.slice().sort((a: any, b: any) => {
        const av = Number(a.composite_score ?? Number.POSITIVE_INFINITY);
        const bv = Number(b.composite_score ?? Number.POSITIVE_INFINITY);
        return av - bv;
      });

      const best = sorted[0];

      // build normalized object used by UI
      const normalized = {
        title: "Optimal",
        net: formatNetDisplay(Number(best.total_cost ?? best.total_cost_pct ?? NaN)),
        friction: `${(Number(best.total_risk ?? best.total_cost ?? 0)).toFixed(2)}%`,
        time: `${Number(best.total_time ?? best.settlement_time_days ?? 0).toFixed(2)}d`,
        risk: Math.round(Number(best.total_risk ?? 0)),
        path: best.path ?? best.p ?? [source, destination],
        savings:
          typeof best.total_cost === "number"
            ? `₹${((amount * (Number(directLoss) / 100) - amount * (Number(best.total_cost) / 100)) / 1e7).toFixed(2)}cr`
            : demoRoute.savings,
        raw: best,
      };

      setRoute(normalized);
    } catch (err: any) {
      console.error("compute-route error", err);
      setError(err?.response?.data?.detail || err.message || "Request failed");
      setRoute(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch when component mounts or when source/destination/weights/amount change
    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, destination, amount, weights?.cost, weights?.time, weights?.risk]);

  const display = route ?? demoRoute;

  const savingsAmount = Number(directLoss) ? (Number(directLoss) / 100) * (amount / 1e7) : 8.5;
  const savingsPercentage = ((Number(savingsAmount) / (amount / 1e7)) * 100).toFixed(1);
  const originalLoss = ((directLoss / 100) * (amount / 1e7)).toFixed(1);

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="relative overflow-hidden transition-all hover:shadow-xl border-2 border-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg p-6">
          <motion.div
            className="absolute right-0 top-0 rounded-bl-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-md flex items-center gap-2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Recommended
            <button
              aria-label="Refresh route"
              onClick={(e) => {
                e.stopPropagation();
                fetchRoute();
              }}
              title="Refresh"
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 text-white" />
            </button>
          </motion.div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-medium text-muted-foreground"> {display.title} Route </CardTitle>
            <div className="text-blue-500 text-2xl">🎯</div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Computing best route…</div>
            ) : error ? (
              <div className="py-4 text-center text-red-500">Error: {error}</div>
            ) : (
              <>
                <motion.div
                  className="text-5xl font-bold mb-2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {display.net}
                </motion.div>
                <p className="text-base font-medium text-green-600 dark:text-green-400 mb-4">{display.savings} vs Direct</p>

                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-5 w-5" /> <span className="text-base">Friction</span>
                    </span>
                    <span className="font-medium text-base">{display.friction}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-5 w-5" /> <span className="text-base">Time</span>
                    </span>
                    <span className="font-medium text-base">{display.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-5 w-5" /> <span className="text-base">Risk</span>
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`h-2.5 w-2.5 rounded-full ${
                            i < Math.round((display.risk ?? 0) / 2) ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-base font-medium">
                  {display.path.map((loc: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-lg">{getCountryFlag(loc)}</span>
                      <motion.span
                        className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800 font-mono"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        {loc}
                      </motion.span>
                      {i < display.path.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Savings Message */}
      <motion.div className="mt-4 text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
          You just saved <span className="text-2xl font-bold">{savingsPercentage}%</span> money compared to{" "}
          <span className="text-xl font-bold">₹{originalLoss}cr</span> of your total capital
        </p>
      </motion.div>
    </motion.div>
  );
}