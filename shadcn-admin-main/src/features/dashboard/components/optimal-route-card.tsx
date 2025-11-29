import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Clock, Shield, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { getCountryFlag } from './country-flags'

interface OptimalRouteCardProps {
  totalAmount?: number
  directLoss?: number
}

export function OptimalRouteCard({ totalAmount = 500, directLoss = 3.8 }: OptimalRouteCardProps) {
  const route = {
    title: 'Optimal',
    net: '₹489cr',
    friction: '2.1%',
    time: '1.5d',
    risk: 3,
    path: ['IN', 'SG', 'US'],
    savings: '+₹8.5cr',
    type: 'optimal' as const,
  }

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

  return (
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
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className='w-full max-w-2xl mx-auto'
      >
        <Card className='relative overflow-hidden transition-all hover:shadow-xl border-2 border-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg p-6'>
          <motion.div
            className='absolute right-0 top-0 rounded-bl-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-md'
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Recommended
          </motion.div>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='text-xl font-medium text-muted-foreground'>
              {route.title} Route
            </CardTitle>
            <div className='text-blue-500 text-2xl'>🎯</div>
          </CardHeader>
          <CardContent>
            <motion.div
              className='text-5xl font-bold mb-2'
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {route.net}
            </motion.div>
            <p className='text-base font-medium text-green-600 dark:text-green-400 mb-4'>
              {route.savings} vs Direct
            </p>

            <div className='space-y-4 text-sm text-muted-foreground'>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-1.5'>
                  <Wallet className='h-5 w-5' /> <span className='text-base'>Friction</span>
                </span>
                <span className='font-medium text-base'>{route.friction}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-1.5'>
                  <Clock className='h-5 w-5' /> <span className='text-base'>Time</span>
                </span>
                <span className='font-medium text-base'>{route.time}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-1.5'>
                  <Shield className='h-5 w-5' /> <span className='text-base'>Risk</span>
                </span>
                <div className='flex gap-0.5'>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ${
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

            <div className='mt-4 flex items-center gap-2 text-base font-medium'>
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
                    <ArrowRight className='h-4 w-4 text-muted-foreground' />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
  )
}

