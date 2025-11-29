import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouteHistory } from '@/stores/routeHistoryStore'
import { Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function LatestGenerations() {
    const scenarios = useRouteHistory((state) => state.scenarios)

    return (
        <>
            <Header>
                <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'>
                        <TrendingUp className='h-6 w-6' />
                    </div>
                    <div className='flex flex-col'>
                        <span className='text-2xl font-extrabold tracking-tight text-foreground'>
                            Latest Generations
                        </span>
                        <span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground'>
                            Route Computation History
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

            <Main fixed>
                <div className='space-y-4 overflow-y-auto h-full pb-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold tracking-tight'>Route History</h1>
                            <p className='text-muted-foreground mt-1'>
                                View your recent capital routing computations
                            </p>
                        </div>
                        <div className='text-sm text-muted-foreground'>
                            {scenarios.length} {scenarios.length === 1 ? 'scenario' : 'scenarios'}
                        </div>
                    </div>

                    {scenarios.length === 0 ? (
                        <Card className='border-dashed'>
                            <CardContent className='flex flex-col items-center justify-center py-16'>
                                <TrendingUp className='h-12 w-12 text-muted-foreground mb-4' />
                                <h3 className='text-lg font-semibold mb-2'>No scenarios yet</h3>
                                <p className='text-muted-foreground text-center max-w-sm'>
                                    Start by computing a route on the dashboard. Your recent computations will
                                    appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className='grid gap-4'>
                            {scenarios.map((scenario, index) => (
                                <motion.div
                                    key={scenario.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className='hover:shadow-lg transition-shadow'>
                                        <CardHeader>
                                            <div className='flex items-start justify-between'>
                                                <div className='space-y-1'>
                                                    <CardTitle className='text-lg font-semibold'>
                                                        {scenario.source} → {scenario.destination}
                                                    </CardTitle>
                                                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                                        <Clock className='h-3 w-3' />
                                                        {new Date(scenario.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <div className='text-2xl font-bold text-blue-600'>
                                                        {scenario.currency} {scenario.amount}cr
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                                                <div>
                                                    <div className='text-xs text-muted-foreground mb-1'>Net Received</div>
                                                    <div className='font-semibold'>{scenario.optimalRoute.net}</div>
                                                </div>
                                                <div>
                                                    <div className='text-xs text-muted-foreground mb-1'>Friction</div>
                                                    <div className='font-semibold text-yellow-600'>
                                                        {scenario.optimalRoute.friction}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className='text-xs text-muted-foreground mb-1'>Time</div>
                                                    <div className='font-semibold'>{scenario.optimalRoute.time}</div>
                                                </div>
                                                <div>
                                                    <div className='text-xs text-muted-foreground mb-1'>Route</div>
                                                    <div className='flex items-center gap-1 text-xs font-medium'>
                                                        {scenario.optimalRoute.path.map((loc, i) => (
                                                            <div key={i} className='flex items-center'>
                                                                <span className='rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800'>
                                                                    {loc}
                                                                </span>
                                                                {i < scenario.optimalRoute.path.length - 1 && (
                                                                    <ArrowRight className='mx-0.5 h-3 w-3 text-muted-foreground' />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </Main>
        </>
    )
}
