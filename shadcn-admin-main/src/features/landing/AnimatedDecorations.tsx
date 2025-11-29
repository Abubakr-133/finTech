import { motion } from 'framer-motion'

export function AnimatedStockGraph() {
    const points = [
        { x: 0, y: 50 },
        { x: 20, y: 45 },
        { x: 40, y: 55 },
        { x: 60, y: 40 },
        { x: 80, y: 60 },
        { x: 100, y: 50 },
        { x: 120, y: 70 },
        { x: 140, y: 65 },
        { x: 160, y: 75 },
        { x: 180, y: 70 },
        { x: 200, y: 80 },
    ]

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    return (
        <svg
            className='absolute opacity-20'
            width='200'
            height='100'
            viewBox='0 0 200 100'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
        >
            <motion.path
                d={pathData}
                stroke='url(#gradient)'
                strokeWidth='2'
                fill='none'
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                    pathLength: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 },
                    opacity: { duration: 0.5 },
                }}
            />
            <defs>
                <linearGradient id='gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                    <stop offset='0%' stopColor='#3b82f6' />
                    <stop offset='100%' stopColor='#14b8a6' />
                </linearGradient>
            </defs>
            {points.map((point, i) => (
                <motion.circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r='3'
                    fill='#3b82f6'
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{
                        delay: (i * 2) / points.length,
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                    }}
                />
            ))}
        </svg>
    )
}

export function AnimatedCurrencySymbols() {
    const symbols = ['$', '€', '¥', '£', '₹']

    return (
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            {symbols.map((symbol, i) => (
                <motion.div
                    key={i}
                    className='absolute text-4xl font-bold opacity-10'
                    style={{
                        left: `${20 + i * 15}%`,
                        top: `${10 + (i % 3) * 30}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.05, 0.15, 0.05],
                    }}
                    transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.5,
                    }}
                >
                    {symbol}
                </motion.div>
            ))}
        </div>
    )
}

export function AnimatedGlowingDots() {
    return (
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className='absolute w-2 h-2 rounded-full bg-blue-400'
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}
        </div>
    )
}

export function AnimatedDataStream() {
    return (
        <div className='absolute right-0 top-1/4 opacity-10'>
            <div className='flex flex-col gap-2 font-mono text-xs'>
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className='flex items-center gap-2'
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{
                            delay: i * 0.1,
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 3,
                        }}
                    >
                        <div className='w-2 h-2 rounded-full bg-green-400' />
                        <span>TX_{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                        <span className='text-blue-400'>
                            {(Math.random() * 1000).toFixed(2)}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
