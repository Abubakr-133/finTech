import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Globe, ShieldCheck, Zap, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import {
    AnimatedStockGraph,
    AnimatedCurrencySymbols,
    AnimatedGlowingDots,
    AnimatedDataStream,
} from './AnimatedDecorations'

export function LandingPage() {
    const navigate = useNavigate()
    const [isVisible, setIsVisible] = useState(false)
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        setIsVisible(true)
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
    }, [])

    const toggleTheme = () => {
        setIsDark(!isDark)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

    const itemVariants = {
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
        <div className={`min-h-screen overflow-x-hidden font-sans selection:bg-blue-500/30 transition-colors duration-500 ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-gray-900'
            }`}>
            {/* Animated Background Elements */}
            <div className='fixed inset-0 overflow-hidden pointer-events-none'>
                <motion.div
                    className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/30'
                        }`}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/30'
                        }`}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1,
                    }}
                />
                <motion.div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl ${isDark ? 'bg-teal-500/5' : 'bg-teal-200/20'
                        }`}
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 backdrop-blur-md transition-colors duration-500 ${isDark ? 'border-b border-white/10 bg-[#0f172a]/80' : 'border-b border-gray-200 bg-white/80'
                }`}>
                <div className='container mx-auto px-6 h-20 flex items-center justify-between'>
                    <motion.div
                        className='flex items-center gap-3'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='h-6 w-6 text-white'
                            >
                                <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                            </svg>
                        </div>
                        <span className='text-2xl font-bold tracking-tight'>CapiFlow</span>
                    </motion.div>
                    <div className='flex items-center gap-4'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={toggleTheme}
                            className='rounded-full'
                        >
                            {isDark ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
                        </Button>
                        <Button
                            onClick={() => navigate({ to: '/dashboard' })}
                            className='bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6'
                        >
                            Launch App
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className='relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden'>
                <div className={`absolute inset-0 ${isDark
                    ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0f172a] to-[#0f172a]'
                    : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-white to-white'
                    }`}></div>

                {/* Animated Decorations */}
                <div className='absolute top-20 left-10 opacity-30'>
                    <AnimatedStockGraph />
                </div>
                <div className='absolute bottom-20 right-10 opacity-30'>
                    <AnimatedStockGraph />
                </div>
                <AnimatedCurrencySymbols />
                <AnimatedGlowingDots />
                <AnimatedDataStream />

                <div className='container mx-auto px-6 relative z-10 text-center'>
                    <motion.div
                        variants={containerVariants}
                        initial='hidden'
                        animate={isVisible ? 'visible' : 'hidden'}
                    >
                        <motion.div variants={itemVariants} className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8'>
                            <span className='relative flex h-2 w-2'>
                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                                <span className='relative inline-flex rounded-full h-2 w-2 bg-blue-500'></span>
                            </span>
                            Live: Global Capital Routing Engine
                        </motion.div>
                        <motion.h1
                            variants={itemVariants}
                            className={`text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 ${isDark
                                ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-300'
                                : 'bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600'
                                }`}
                        >
                            Legal Capital Flows <br /> with Zero Friction
                        </motion.h1>
                        <motion.p
                            variants={itemVariants}
                            className={`text-xl max-w-2xl mx-auto mb-12 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}
                        >
                            CapiFlow is the intelligent GPS for international finance. We simulate multi-hop legal routes to minimize friction costs, optimize for tax treaties, and ensure 100% compliance.
                        </motion.p>
                        <motion.div
                            variants={itemVariants}
                            className='flex flex-col sm:flex-row items-center justify-center gap-4'
                        >
                            <Button
                                size='lg'
                                onClick={() => navigate({ to: '/dashboard' })}
                                className='h-14 px-8 text-lg rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all hover:scale-105'
                            >
                                Start Routing Capital <ArrowRight className='ml-2 h-5 w-5' />
                            </Button>
                            <Button
                                variant='outline'
                                size='lg'
                                className={`h-14 px-8 text-lg rounded-full transition-all ${isDark
                                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                View Documentation
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className={`py-24 relative ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                <div className='container mx-auto px-6'>
                    <div className='grid lg:grid-cols-2 gap-16 items-center'>
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className='order-2 lg:order-1 relative group'
                        >
                            <div className='absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000'></div>
                            <div className={`relative rounded-2xl p-8 shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-200'
                                }`}>
                                <div className={`flex items-center justify-between mb-6 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-gray-200'
                                    }`}>
                                    <div className='flex items-center gap-2'>
                                        <div className='h-3 w-3 rounded-full bg-red-500'></div>
                                        <div className='h-3 w-3 rounded-full bg-yellow-500'></div>
                                        <div className='h-3 w-3 rounded-full bg-green-500'></div>
                                    </div>
                                    <div className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                        simulation_result.json
                                    </div>
                                </div>
                                <div className='space-y-4 font-mono text-sm'>
                                    <motion.div
                                        className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-gray-600'}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span>Route:</span>
                                        <span className='text-blue-400'>IN → SG → US</span>
                                    </motion.div>
                                    <motion.div
                                        className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-gray-600'}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <span>Net Received:</span>
                                        <span className='text-green-400'>₹489.5 Cr</span>
                                    </motion.div>
                                    <motion.div
                                        className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-gray-600'}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <span>Friction:</span>
                                        <span className='text-yellow-400'>2.1% (Optimal)</span>
                                    </motion.div>
                                    <motion.div
                                        className={`h-2 rounded-full mt-4 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.div
                                            className='h-full bg-gradient-to-r from-blue-500 to-teal-400'
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '85%' }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.6, duration: 1 }}
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className='order-1 lg:order-2'
                        >
                            <div className='inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 mb-6'>
                                <Globe className='h-6 w-6' />
                            </div>
                            <h2 className='text-3xl lg:text-4xl font-bold mb-6'>
                                Navigate the Global Financial Web
                            </h2>
                            <p className={`text-lg leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                CapiFlow is a web app that shows companies the smartest legal way to move large amounts of money across borders.
                            </p>
                            <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                We help you lose less to hidden costs like FX spreads and bank fees, providing clear explanations in plain language so you can make decisions with confidence.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Explanation Section 2 */}
            <section className={`py-24 border-y ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-gray-200'
                }`}>
                <div className='container mx-auto px-6'>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className='max-w-4xl mx-auto text-center mb-16'
                    >
                        <h2 className='text-3xl lg:text-4xl font-bold mb-6'>
                            What CapiFlow Is (Beginner-Friendly)
                        </h2>
                        <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Think of us as a GPS for big international money movements.
                        </p>
                    </motion.div>

                    <div className='grid md:grid-cols-3 gap-8'>
                        {[
                            {
                                icon: <Zap className='h-6 w-6 text-yellow-400' />,
                                title: 'Simulate Paths',
                                desc: 'Instead of choosing one obvious route (India → US), we simulate many legal paths (India → Singapore → US, etc.).',
                            },
                            {
                                icon: <ShieldCheck className='h-6 w-6 text-green-400' />,
                                title: '100% Compliant',
                                desc: 'It does not help anyone hide money or break rules; it only works with legal, treaty-based structures.',
                            },
                            {
                                icon: <Globe className='h-6 w-6 text-blue-400' />,
                                title: 'Optimize Outcomes',
                                desc: 'We show which route is best based on your specific priorities: cost, speed, and risk.',
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className={`p-8 rounded-2xl transition-all group ${isDark
                                    ? 'bg-[#0f172a] border border-slate-800 hover:border-blue-500/50'
                                    : 'bg-gray-50 border border-gray-200 hover:border-blue-400/50 hover:shadow-lg'
                                    }`}
                            >
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'
                                    }`}>
                                    {item.icon}
                                </div>
                                <h3 className='text-xl font-bold mb-3'>{item.title}</h3>
                                <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`py-32 relative overflow-hidden ${isDark ? '' : 'bg-gradient-to-b from-white to-blue-50'}`}>
                <div className={`absolute inset-0 ${isDark ? 'bg-blue-600/5' : 'bg-blue-100/30'}`}></div>
                <div className='container mx-auto px-6 relative z-10 text-center'>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className='text-4xl lg:text-5xl font-bold mb-8'>
                            Ready to Optimize Your Capital?
                        </h2>
                        <p className={`text-xl mb-12 max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Join forward-thinking CFOs who are saving millions in friction costs.
                        </p>
                        <Button
                            size='lg'
                            onClick={() => navigate({ to: '/dashboard' })}
                            className={`h-16 px-10 text-xl rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 font-bold ${isDark
                                ? 'bg-white text-blue-900 hover:bg-blue-50'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            Launch Dashboard Now
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`py-8 border-t text-center text-sm ${isDark ? 'border-white/10 bg-[#0f172a] text-slate-500' : 'border-gray-200 bg-white text-gray-500'
                }`}>
                <p>© 2025 CapiFlow Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}
