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

export function Dashboard() {
  const [showResults, setShowResults] = useState(false)
  const [isBotCollapsed, setIsBotCollapsed] = useState(false)
  const addScenario = useRouteHistory((state) => state.addScenario)

  const handleCompute = (params: any) => {
    setShowResults(true)

    // Save to history
    addScenario({
      source: params.source,
      destination: params.destination,
      amount: params.amount,
      currency: params.currency,
      optimalRoute: {
        net: '₹489cr',
        friction: '2.1%',
        time: '1.5d',
        path: ['IN', 'SG', 'US'],
      },
    })
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

            {/* Results Section (Conditional) */}
            {showResults && (
              <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
                {/* Optimal Route Card */}
                <OptimalRouteCard totalAmount={500} directLoss={3.8} />

                {/* Why this Route Fits */}
                <RouteExplanation />

                {/* Other 3 Route Cards */}
                <OtherRouteCards />

                {/* Advanced Details (Toggleable) */}
                <AdvancedDetails />
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
