import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Clock, Shield, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

interface RouteCardProps {
    title: string
    net: string
    friction: string
    time: string
    risk: number
    path: string[]
    savings: string
    type: 'optimal' | 'cheapest' | 'fastest' | 'safest'
}

export function RouteCards() {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

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
            className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
        >
            {routes.map((route, index) => (
                <motion.div
                    key={route.title}
                    variants={cardVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                    <Card
                        className={`relative overflow-hidden transition-all hover:shadow-xl ${route.type === 'optimal'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                            : 'hover:border-blue-400/50'
                            }`}
                    >
                        {route.type === 'optimal' && (
                            <motion.div
                                className='absolute right-0 top-0 rounded-bl-lg bg-blue-500 px-2 py-1 text-xs font-bold text-white'
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Recommended
                            </motion.div>
                        )}
                        {/* Animated border effect */}
                        <motion.div
                            className='absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity'
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
                            }}
                            animate={{
                                x: ['-100%', '100%'],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium text-muted-foreground'>
                                {route.title} Route
                            </CardTitle>
                            {getIcon(route.type)}
                        </CardHeader>
                        <CardContent>
                            <motion.div
                                className='text-2xl font-bold'
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                {route.net}
                            </motion.div>
                            <p className='text-xs font-medium text-green-600 dark:text-green-400'>
                                {route.savings} vs Direct
                            </p>

                            <div className='mt-4 space-y-2 text-xs text-muted-foreground'>
                                <div className='flex items-center justify-between'>
                                    <span className='flex items-center gap-1'>
                                        <Wallet className='h-3 w-3' /> Friction
                                    </span>
                                    <span className='font-medium'>{route.friction}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='flex items-center gap-1'>
                                        <Clock className='h-3 w-3' /> Time
                                    </span>
                                    <span className='font-medium'>{route.time}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='flex items-center gap-1'>
                                        <Shield className='h-3 w-3' /> Risk
                                    </span>
                                    <div className='flex gap-0.5'>
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className={`h-1.5 w-1.5 rounded-full ${i < route.risk / 2 ? 'bg-red-500' : 'bg-gray-200'
                                                    }`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: index * 0.1 + 0.3 + i * 0.05 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className='mt-4 flex items-center gap-1 text-xs font-medium'>
                                {route.path.map((loc, i) => (
                                    <div key={i} className='flex items-center'>
                                        <motion.span
                                            className='rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800'
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 + 0.4 + i * 0.1 }}
                                        >
                                            {loc}
                                        </motion.span>
                                        {i < route.path.length - 1 && (
                                            <ArrowRight className='mx-1 h-3 w-3 text-muted-foreground' />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    )
}

function getIcon(type: string) {
    switch (type) {
        case 'optimal':
            return <div className='text-blue-500'>🎯</div>
        case 'cheapest':
            return <div className='text-green-500'>💰</div>
        case 'fastest':
            return <div className='text-yellow-500'>⚡</div>
        case 'safest':
            return <div className='text-purple-500'>🛡️</div>
        default:
            return null
    }
}
