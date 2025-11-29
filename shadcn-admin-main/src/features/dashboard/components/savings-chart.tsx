import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'

const savingsData = [
  {
    route: 'Direct',
    netReceived: 481.0,
    friction: 3.8,
    savings: 0,
    color: '#ef4444',
  },
  {
    route: 'Optimal',
    netReceived: 489.5,
    friction: 2.1,
    savings: 8.5,
    color: '#10b981',
  },
  {
    route: 'Cheapest',
    netReceived: 487.0,
    friction: 1.8,
    savings: 6.0,
    color: '#3b82f6',
  },
  {
    route: 'Fastest',
    netReceived: 485.0,
    friction: 2.8,
    savings: 4.0,
    color: '#f59e0b',
  },
]

export function SavingsChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Savings Comparison: Optimized vs Direct Route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {/* Net Received Comparison */}
            <div>
              <h4 className='text-sm font-semibold mb-4 text-muted-foreground'>Net Received (₹ cr)</h4>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='route' className='text-xs' />
                  <YAxis className='text-xs' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `₹${value}cr`}
                  />
                  <Bar dataKey='netReceived' radius={[8, 8, 0, 0]}>
                    {savingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Friction Comparison */}
            <div>
              <h4 className='text-sm font-semibold mb-4 text-muted-foreground'>Friction Cost (%)</h4>
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='route' className='text-xs' />
                  <YAxis className='text-xs' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Bar dataKey='friction' fill='#ef4444' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Savings Summary */}
            <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
              <div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <p className='text-2xl font-bold text-green-600 dark:text-green-400'>₹8.5cr</p>
                <p className='text-xs text-muted-foreground mt-1'>Total Savings</p>
              </div>
              <div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>1.7%</p>
                <p className='text-xs text-muted-foreground mt-1'>Friction Reduction</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

