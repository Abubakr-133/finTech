import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { CapitalInputForm } from './components/capital-input-form'
import { OptimalRouteCard } from './components/optimal-route-card'
import { OtherRouteCards } from './components/other-route-cards'
import { RouteExplanation } from './components/route-explanation'
import { AdvancedDetails } from './components/advanced-details'
import { AIBotPanel } from './components/ai-bot-panel'
import { AnimatedBackground } from './components/animated-background'
import { useRouteHistory } from '@/stores/routeHistoryStore'
import axios from "axios";


export function Dashboard() {
  const [showResults, setShowResults] = useState(false)
  const [isBotCollapsed, setIsBotCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<any>(null)
  const addScenario = useRouteHistory((state) => state.addScenario)

  // Use an env var for base URL in production
  const API_BASE = import.meta.env.VITE_PUBLIC_API_BASE || "http://localhost:8000"

  const handleCompute = async (params: any) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        source: params.source,
        destination: params.destination,
        amount: params.amount,
        currency: params.currency || "INR",
        weight_cost: params.weights?.cost ?? 0.6,
        weight_time: params.weights?.time ?? 0.2,
        weight_risk: params.weights?.risk ?? 0.2,
        max_hops: params.maxHops ?? 3,
        k: params.k ?? 3
      }

      const resp = await axios.post(`${API_BASE}/api/compute-route`, payload, { timeout: 20000 })
      const data = resp.data
      const optimalRoute = data.results[0]
      // Persist to local route history store
      addScenario({
        source: params.source,
        destination: params.destination,
        amount: params.amount,
        currency: params.currency,
        optimalRoute: {
          net: optimalRoute.total_cost, // adapt formatting
          friction: optimalRoute.total_risk,
          time: optimalRoute.total_time,
          path: optimalRoute.path
        },
      })

      setResultData(data)
      setShowResults(true)
    } catch (err: any) {
      console.error("Compute error", err)
      setError(err?.response?.data?.detail || err.message || "Request failed")
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Animated Background */}
      <AnimatedBackground />

      {/* ===== Top Heading ===== */}
      <Header className='relative z-20'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-6 w-6'
            >
              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
            </svg>
          </div>
          <div className='flex flex-col'>
            <span className='text-2xl font-extrabold tracking-tight text-foreground'>
              CapiFlow
            </span>
            <span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground'>
              Global Capital Routing
            </span>
          </div>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main fixed>
        <div
          className={`grid grid-cols-1 gap-4 h-full transition-all duration-300 ${isBotCollapsed ? 'lg:grid-cols-[1fr_auto]' : 'lg:grid-cols-4'
            }`}
        >
          {/* Center Content (Inputs + Results) */}
          <div
            className={`space-y-4 overflow-y-auto pb-4 relative z-10 ${isBotCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'
              }`}
          >
            <div className='flex items-center justify-between'>
              <h1 className='text-2xl font-bold tracking-tight'>
                Capital Routing Dashboard
              </h1>
              <div className='flex items-center space-x-2'>
                <Button variant='outline'>Export Report</Button>
              </div>
            </div>

            {/* Input Section */}
            <CapitalInputForm onCompute={handleCompute} />

            <div className='flex items-center gap-2'>
          {loading && <div className="text-sm text-muted-foreground">Computing routes…</div>}
          {error && <div className="text-sm text-red-500">Error: {error}</div>}
        </div>

            {/* Results Section (Conditional) */}
            {showResults && resultData && (
          <div className='space-y-6'>
            <OptimalRouteCard data={{'source':resultData.source, 'destination':resultData.destination,"amount":resultData.amount, "directLoss":resultData.results[0].composite_score, "route":resultData.results[0]}} totalAmount={500} directLoss={3.8} />
            {/* <RouteExplanation data={resultData.optimal_route} />
            <OtherRouteCards data={resultData.other_routes} />
            <AdvancedDetails data={resultData.optimal_route} /> */}
          </div>
        )}
          </div>

          {/* Right Sidebar (AI Bot) */}
          <div className='col-span-1 hidden lg:block relative z-10'>
            <AIBotPanel
              isCollapsed={isBotCollapsed}
              toggleCollapse={() => setIsBotCollapsed(!isBotCollapsed)}
            />
          </div>
        </div>
      </Main>
    </>
  )
}
