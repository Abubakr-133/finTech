import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// const comparisonData = [
//   {
//     route: 'Optimal',
//     net: '₹489.5cr',
//     friction: '2.1%',
//     vsDirect: '+₹8.5cr',
//     time: '1.5d',
//     risk: '3/10',
//     path: 'IN→SG→US',
//     tags: ['Recommended', 'DTAA'],
//   },
//   {
//     route: 'Direct',
//     net: '₹481.0cr',
//     friction: '3.8%',
//     vsDirect: '-',
//     time: '3.0d',
//     risk: '6/10',
//     path: 'IN→US',
//     tags: ['Standard'],
//   },
//   {
//     route: 'Via UAE',
//     net: '₹486.0cr',
//     friction: '2.8%',
//     vsDirect: '+₹5.0cr',
//     time: '2.0d',
//     risk: '5/10',
//     path: 'IN→AE→US',
//     tags: ['Fast'],
//   },
//   {
//     route: 'Via Mauritius',
//     net: '₹487.2cr',
//     friction: '1.9%',
//     vsDirect: '+₹6.2cr',
//     time: '2.5d',
//     risk: '5/10',
//     path: 'IN→MU→US',
//     tags: ['Low Cost'],
//   },
// ]

// const fullComparisonData = [
//   {
//     route: 'Optimal (IN→SG→US)',
//     costPercent: 2.1,
//     timeDays: 1.5,
//     riskScore: 3,
//     compositeScore: 92,
//   },
//   {
//     route: 'Direct (IN→US)',
//     costPercent: 3.8,
//     timeDays: 3.0,
//     riskScore: 6,
//     compositeScore: 65,
//   },
//   {
//     route: 'Via UAE (IN→AE→US)',
//     costPercent: 2.8,
//     timeDays: 2.0,
//     riskScore: 5,
//     compositeScore: 78,
//   },
//   {
//     route: 'Via Mauritius (IN→MU→US)',
//     costPercent: 1.9,
//     timeDays: 2.5,
//     riskScore: 5,
//     compositeScore: 82,
//   },
// ]

// const hopComparisonData = [
//   { type: 'Direct Hop', routes: 1, avgCost: 3.8, avgTime: 3.0 },
//   { type: '2-Hop', routes: 3, avgCost: 2.3, avgTime: 2.0 },
//   { type: '3-Hop', routes: 2, avgCost: 2.1, avgTime: 1.8 },
// ]

export function AdvancedDetails() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [comparisonData, setComparisonData] = useState([])
  const [fullComparisonData, setFullComparisonData] = useState([])
  const [hopComparisonData, setHopComparisonData] = useState([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("http://127.0.0.1:8000/api/routes/comparison")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const payload = await res.json()
        setComparisonData(payload.comparisonData || [])
        setFullComparisonData(payload.fullComparisonData || [])
        setHopComparisonData(payload.hopComparisonData || [])
      } catch (err) {
        console.error("Failed to load route data:", err)
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Details (Advanced)</CardTitle>
            <Button variant='ghost' size='sm' onClick={() => setIsOpen(!isOpen)} className='gap-2'>
              {isOpen ? (<><ChevronUp className='h-4 w-4'/> Hide</>) : (<><ChevronDown className='h-4 w-4'/> Show</>)}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
              <CardContent className='space-y-6 pt-0'>

                {/* Loading / Error */}
                {loading && <div className="p-4">Loading route details...</div>}
                {error && <div className="p-4 text-red-500">Error: {error}</div>}

                {/* Full Comparison Table */}
                {!loading && !error && (
                  <>

                <div>
                  <h3 className='text-lg font-semibold mb-4'>Detailed Route Comparison</h3>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route Strategy</TableHead>
                          <TableHead>Net Received</TableHead>
                          <TableHead>Friction %</TableHead>
                          <TableHead className='text-green-600'>Savings</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Risk Score</TableHead>
                          <TableHead>Path</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((row) => (
                          <TableRow key={row.route}>
                            <TableCell className='font-medium'>
                              <div className='flex flex-col'>
                                <span>{row.route}</span>
                                <div className='flex gap-1 mt-1'>
                                  {row.tags.map((tag) => (
                                    <Badge
                                      variant='secondary'
                                      className='text-[10px] px-1 py-0'
                                      key={tag}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='font-bold'>{row.net}</TableCell>
                            <TableCell>{row.friction}</TableCell>
                            <TableCell className='text-green-600 font-medium'>
                              {row.vsDirect}
                            </TableCell>
                            <TableCell>{row.time}</TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='h-2 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden'>
                                  <div
                                    className={`h-full ${
                                      parseInt(row.risk) < 4
                                        ? 'bg-green-500'
                                        : parseInt(row.risk) < 7
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                    }`}
                                    style={{ width: `${parseInt(row.risk) * 10}%` }}
                                  />
                                </div>
                                <span className='text-xs text-muted-foreground'>{row.risk}</span>
                              </div>
                            </TableCell>
                            <TableCell className='font-mono text-xs'>{row.path}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Direct-hop vs 3-hop Bar Chart */}
                <div>
                  <h3 className='text-lg font-semibold mb-4'>Route Hops Comparison</h3>
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={hopComparisonData}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis 
                        dataKey='type' 
                        className='text-xs'
                        label={{ value: 'Route Type', position: 'insideBottom', offset: -5, className: 'text-xs fill-muted-foreground' }}
                      />
                      <YAxis 
                        className='text-xs'
                        label={{ value: 'Value', angle: -90, position: 'insideLeft', className: 'text-xs fill-muted-foreground' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Avg Cost %') return [`${value}%`, 'Avg Cost']
                          if (name === 'Avg Time (days)') return [`${value} days`, 'Avg Time']
                          return [value, name]
                        }}
                      />
                      <Bar dataKey='avgCost' fill='#ef4444' name='Avg Cost %' radius={[8, 8, 0, 0]} />
                      <Bar dataKey='avgTime' fill='#3b82f6' name='Avg Time (days)' radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Full Comparison Table */}
                <div>
                  <h3 className='text-lg font-semibold mb-4'>Full Comparison Table</h3>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Routes</TableHead>
                          <TableHead>Cost %</TableHead>
                          <TableHead>Time (days)</TableHead>
                          <TableHead>Risk Score</TableHead>
                          <TableHead>Composite Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullComparisonData.map((row) => (
                          <TableRow key={row.route}>
                            <TableCell className='font-medium'>{row.route}</TableCell>
                            <TableCell>{row.costPercent}%</TableCell>
                            <TableCell>{row.timeDays}d</TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='h-2 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden'>
                                  <div
                                    className={`h-full ${
                                      row.riskScore < 4
                                        ? 'bg-green-500'
                                        : row.riskScore < 7
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                    }`}
                                    style={{ width: `${row.riskScore * 10}%` }}
                                  />
                                </div>
                                <span className='text-xs'>{row.riskScore}/10</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='h-2 w-20 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden'>
                                  <div
                                    className='h-full bg-blue-500'
                                    style={{ width: `${row.compositeScore}%` }}
                                  />
                                </div>
                                <span className='text-xs font-semibold'>{row.compositeScore}/100</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                  </>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

