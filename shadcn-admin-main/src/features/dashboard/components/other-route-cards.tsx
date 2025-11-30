// OtherRouteCards.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Clock, Shield, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { getCountryFlag } from './country-flags'

type RouteCardProps = {
  title: string
  net: string
  friction: string
  time: string
  risk: number
  path: string[]
  savings: string
  type: 'cheapest' | 'fastest' | 'safest'
}

export function OtherRouteCards({
  origin = "IN",
  destination = "US",
  amount_musd = 500,
  weights = { cost: 0.6, speed: 0.2, risk: 0.2 }
}) {
  const [routes, setRoutes] = useState<RouteCardProps[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const resp = await fetch("/route/options", {           // add proxy or full URL if needed
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            amount_musd,
            weights,
            max_hops: 3,
            top_k: 3
          })
        })
        if (!resp.ok) {
          const text = await resp.text()
          throw new Error(`Server ${resp.status}: ${text}`)
        }
        const json = await resp.json()
        // map server cards -> client props (validate shape)
        const cards: RouteCardProps[] = (json.cards || []).map((c: any) => ({
          title: c.title || "Route",
          net: c.net || "₹0",
          friction: c.friction || "0%",
          time: c.time || "0d",
          risk: c.risk ?? 3,
          path: c.path || [],
          savings: c.savings || "+₹0",
          type: c.type || "cheapest"
        }))
        if (mounted) setRoutes(cards)
      } catch (e: any) {
        console.error("Route options fetch error", e)
        if (mounted) setErr(e.message || "Failed to fetch routes")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [origin, destination, amount_musd, weights])

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'cheapest': return <div className='text-green-500 text-xl'>💰</div>
      case 'fastest':  return <div className='text-yellow-500 text-xl'>⚡</div>
      case 'safest':   return <div className='text-purple-500 text-xl'>🛡️</div>
      default: return null
    }
  }

  const RouteCard = ({ route }: { route: RouteCardProps }) => (
    <motion.div variants={cardVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
      <Card className='relative overflow-hidden transition-all hover:shadow-xl hover:border-blue-400/50'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>{route.title} Route</CardTitle>
          {getIcon(route.type)}
        </CardHeader>
        <CardContent>
          <motion.div className='text-2xl font-bold' initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
            {route.net}
          </motion.div>
          <p className='text-xs font-medium text-green-600 dark:text-green-400 mb-4'>{route.savings} vs Direct</p>

          <div className='space-y-2 text-xs text-muted-foreground'>
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1'><Wallet className='h-3 w-3' /> Friction</span>
              <span className='font-medium'>{route.friction}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1'><Clock className='h-3 w-3' /> Time</span>
              <span className='font-medium'>{route.time}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1'><Shield className='h-3 w-3' /> Risk</span>
              <div className='flex gap-0.5'>
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} className={`h-1.5 w-1.5 rounded-full ${i < Math.ceil(route.risk/2) ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} />
                ))}
              </div>
            </div>
          </div>

          <div className='mt-4 flex items-center gap-2 text-xs font-medium'>
            {route.path.map((loc, i) => (
              <div key={i} className='flex items-center gap-1.5'>
                <span className='text-lg'>{getCountryFlag(loc)}</span>
                <motion.span className='rounded bg-gray-100 px-2 py-1 dark:bg-gray-800 font-mono' initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>{loc}</motion.span>
                {i < route.path.length - 1 && <ArrowRight className='h-3 w-3 text-muted-foreground' />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // loading / error / fallback
  if (loading) {
    return <div className="grid md:grid-cols-3 gap-4"> {[0,1,2].map(i => <div key={i} className="p-4 rounded-md bg-surface/30 animate-pulse h-40" />)} </div>
  }
  if (err) {
    return <div className="text-sm text-red-500">Failed to load routes: {err}</div>
  }

  // if no dynamic routes, fallback to static sample set (keeps UI)
  const displayRoutes = routes && routes.length > 0 ? routes : [
    { title: 'Cheapest', net: '₹487cr', friction: '1.8%', time: '2.5d', risk: 5, path: ['IN','MU','US'], savings: '+₹6.5cr', type: 'cheapest' },
    { title: 'Fastest', net: '₹485cr', friction: '2.8%', time: '1d', risk: 4, path: ['IN','UK','US'], savings: '+₹4.5cr', type: 'fastest' },
    { title: 'Safest', net: '₹482cr', friction: '3.2%', time: '2d', risk: 1, path: ['IN','DE','US'], savings: '+₹1.5cr', type: 'safest' },
  ]

  return (
    <motion.div className='grid gap-4 md:grid-cols-3' initial='hidden' animate='visible' variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}>
      {displayRoutes.map((route, idx) => <RouteCard key={idx} route={route} />)}
    </motion.div>
  )
}
