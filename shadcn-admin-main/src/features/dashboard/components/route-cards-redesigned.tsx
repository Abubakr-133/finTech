import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Clock, Shield, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { getCountryFlag } from './country-flags'

interface RouteCardProps {
  title: string
  net: string
  friction: string
  time: string
  risk: number
  path: string[]
  savings: string
  type: 'optimal' | 'cheapest' | 'fastest' | 'safest'
  isOptimal?: boolean
}

interface RouteCardsRedesignedProps {
  totalAmount?: number
  directLoss?: number
}

export function RouteCardsRedesigned({ totalAmount = 500, directLoss = 3.8 }: RouteCardsRedesignedProps) {
  const routes: RouteCardProps[] = [
    {
      title: 'Optimal',
      net: '₹489cr',
      friction: '2.1%',
      time: '1.5d',
      risk: 3,
      path: ['IN', 'SG', 'US'],
      savings: '+₹8.5cr',
      type: 'optimal',
      isOptimal: true,
    },
    {
      title: 'Cheapest',
      net: '₹487cr',
      friction: '1.8%',
      time: '2.5d',
      risk: 5,
      path: ['IN', 'MU', 'US'],
      savings: '+₹6.5cr',
      type: 'cheapest',
    },
    {
      title: 'Fastest',
      net: '₹485cr',
      friction: '2.8%',
      time: '1d',
      risk: 4,
      path: ['IN', 'UK', 'US'],
      savings: '+₹4.5cr',
      type: 'fastest',
    },
    {
      title: 'Safest',
      net: '₹482cr',
      friction: '3.2%',
      time: '2d',
      risk: 1,
      path: ['IN', 'DE', 'US'],
      savings: '+₹1.5cr',
      type: 'safest',
    },
  ]

  const optimalRoute = routes[0]
  const otherRoutes = routes.slice(1)

  // Calculate savings percentage
  const savingsAmount = 8.5 // ₹8.5cr saved
  const savingsPercentage = ((savingsAmount / totalAmount) * 100).toFixed(1)
  const originalLoss = ((directLoss / 100) * totalAmount).toFixed(1)

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  }

  const RouteCard = ({ route, isLarge = false }: { route: RouteCardProps; isLarge?: boolean }) => (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={isLarge ? 'w-full max-w-2xl mx-auto' : ''}
    >
      <Card
        className={`relative overflow-hidden transition-all hover:shadow-xl ${
          route.type === 'optimal'
            ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg'
            : 'hover:border-blue-400/50'
        } ${isLarge ? 'p-6' : ''}`}
      >
        {route.type === 'optimal' && (
          <motion.div
            className='absolute right-0 top-0 rounded-bl-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-md'
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Recommended
          </motion.div>
        )}
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isLarge ? 'pb-4' : 'pb-2'}`}>
          <CardTitle className={`${isLarge ? 'text-xl' : 'text-sm'} font-medium text-muted-foreground`}>
            {route.title} Route
          </CardTitle>
          {getIcon(route.type)}
        </CardHeader>
        <CardContent>
          <motion.div
            className={isLarge ? 'text-5xl font-bold mb-2' : 'text-2xl font-bold'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {route.net}
          </motion.div>
          <p className={`${isLarge ? 'text-base' : 'text-xs'} font-medium text-green-600 dark:text-green-400 mb-4`}>
            {route.savings} vs Direct
          </p>

          <div className={`${isLarge ? 'space-y-4' : 'space-y-2'} ${isLarge ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1.5'>
                <Wallet className={isLarge ? 'h-5 w-5' : 'h-3 w-3'} /> <span className={isLarge ? 'text-base' : ''}>Friction</span>
              </span>
              <span className={`font-medium ${isLarge ? 'text-base' : ''}`}>{route.friction}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1.5'>
                <Clock className={isLarge ? 'h-5 w-5' : 'h-3 w-3'} /> <span className={isLarge ? 'text-base' : ''}>Time</span>
              </span>
              <span className={`font-medium ${isLarge ? 'text-base' : ''}`}>{route.time}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1.5'>
                <Shield className={isLarge ? 'h-5 w-5' : 'h-3 w-3'} /> <span className={isLarge ? 'text-base' : ''}>Risk</span>
              </span>
              <div className='flex gap-0.5'>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`${isLarge ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'} rounded-full ${
                      i < route.risk / 2 ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-4 flex items-center gap-2 ${isLarge ? 'text-base' : 'text-xs'} font-medium`}>
            {route.path.map((loc, i) => (
              <div key={i} className='flex items-center gap-1.5'>
                <span className='text-lg'>{getCountryFlag(loc)}</span>
                <motion.span
                  className='rounded bg-gray-100 px-2 py-1 dark:bg-gray-800 font-mono'
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  {loc}
                </motion.span>
                {i < route.path.length - 1 && (
                  <ArrowRight className={`${isLarge ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className='space-y-6'>
      {/* Optimal Card - Centered and Larger */}
      <motion.div
        initial='hidden'
        animate='visible'
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
        <RouteCard route={optimalRoute} isLarge={true} />

        {/* Savings Message */}
        <motion.div
          className='mt-4 text-center'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className='text-lg font-semibold text-green-600 dark:text-green-400'>
            You just saved <span className='text-2xl font-bold'>{savingsPercentage}%</span> money compared to{' '}
            <span className='text-xl font-bold'>₹{originalLoss}cr</span> of your total capital
          </p>
        </motion.div>
      </motion.div>

      {/* Other 3 Cards - Below in Grid */}
      <motion.div
        className='grid gap-4 md:grid-cols-3'
        initial='hidden'
        animate='visible'
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.3,
            },
          },
        }}
      >
        {otherRoutes.map((route) => (
          <RouteCard key={route.title} route={route} />
        ))}
      </motion.div>
    </div>
  )
}

function getIcon(type: string) {
  switch (type) {
    case 'optimal':
      return <div className='text-blue-500 text-2xl'>🎯</div>
    case 'cheapest':
      return <div className='text-green-500 text-xl'>💰</div>
    case 'fastest':
      return <div className='text-yellow-500 text-xl'>⚡</div>
    case 'safest':
      return <div className='text-purple-500 text-xl'>🛡️</div>
    default:
      return null
  }
}

