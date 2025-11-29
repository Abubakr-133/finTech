import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function AnimatedBackground() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className='fixed inset-0 -z-10 overflow-hidden pointer-events-none'>
      {/* Animated Gradient Mesh Blobs */}
      <div className='absolute inset-0'>
        {/* Large Blue Blob */}
        <motion.div
          className={`absolute rounded-full blur-3xl ${
            isDark
              ? 'bg-blue-600/60'
              : 'bg-blue-400/70'
          }`}
          style={{
            width: '600px',
            height: '600px',
            top: '-200px',
            left: '-100px',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 150, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Large Indigo Blob */}
        <motion.div
          className={`absolute rounded-full blur-3xl ${
            isDark
              ? 'bg-indigo-600/55'
              : 'bg-indigo-400/65'
          }`}
          style={{
            width: '700px',
            height: '700px',
            top: '20%',
            right: '-150px',
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, -100, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Medium Purple Blob */}
        <motion.div
          className={`absolute rounded-full blur-3xl ${
            isDark
              ? 'bg-purple-600/50'
              : 'bg-purple-400/60'
          }`}
          style={{
            width: '500px',
            height: '500px',
            bottom: '-150px',
            left: '30%',
          }}
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Cyan Accent Blob */}
        <motion.div
          className={`absolute rounded-full blur-3xl ${
            isDark
              ? 'bg-cyan-500/45'
              : 'bg-cyan-400/55'
          }`}
          style={{
            width: '450px',
            height: '450px',
            bottom: '10%',
            right: '20%',
          }}
          animate={{
            x: [0, -60, 0],
            y: [0, 90, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />
      </div>

      {/* Floating Orbs with Glow */}
      <div className='absolute inset-0'>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className={`absolute rounded-full ${
              isDark
                ? 'bg-blue-500/35'
                : 'bg-blue-400/45'
            } blur-xl`}
            style={{
              width: `${150 + Math.random() * 100}px`,
              height: `${150 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [
                0,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                0,
              ],
              y: [
                0,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                0,
              ],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.3, 0.6, 0.4, 0.3],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Animated Grid Pattern */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)]'
            : 'bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)]'
        }`}
        style={{
          backgroundSize: '60px 60px',
        }}
      >
        <motion.div
          className='absolute inset-0'
          animate={{
            backgroundPosition: ['0% 0%', '60px 60px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Floating Geometric Shapes */}
      <div className='absolute inset-0'>
        {[...Array(6)].map((_, i) => {
          const shapes = ['circle', 'square', 'triangle']
          const shape = shapes[i % shapes.length]
          const size = 80 + Math.random() * 60

          return (
            <motion.div
              key={`shape-${i}`}
              className={`absolute ${
                isDark
                  ? 'border-blue-500/15'
                  : 'border-blue-400/20'
              } ${
                shape === 'circle'
                  ? 'rounded-full'
                  : shape === 'triangle'
                    ? 'rotate-45'
                    : ''
              }`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                borderWidth: '2px',
                borderStyle: 'dashed',
              }}
              animate={{
                rotate: [0, 360],
                x: [
                  0,
                  (Math.random() - 0.5) * 300,
                  (Math.random() - 0.5) * 300,
                  0,
                ],
                y: [
                  0,
                  (Math.random() - 0.5) * 300,
                  (Math.random() - 0.5) * 300,
                  0,
                ],
                opacity: [0.1, 0.3, 0.2, 0.1],
              }}
              transition={{
                duration: 20 + Math.random() * 15,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 5,
              }}
            />
          )
        })}
      </div>

      {/* Floating Currency Symbols */}
      <div className='absolute inset-0'>
        {['₹', '$', '€', '£', '¥'].map((symbol, i) => (
          <motion.div
            key={`currency-${i}`}
            className={`absolute text-6xl font-bold ${
              isDark
                ? 'text-blue-500/15'
                : 'text-blue-400/20'
            } select-none`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.25, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      {/* Animated Connection Lines (Network Effect) */}
      <svg className='absolute inset-0 w-full h-full opacity-20 dark:opacity-10'>
        {[...Array(12)].map((_, i) => {
          const x1 = Math.random() * 100
          const y1 = Math.random() * 100
          const x2 = Math.random() * 100
          const y2 = Math.random() * 100

          return (
            <motion.line
              key={`line-${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={isDark ? '#3b82f6' : '#60a5fa'}
              strokeWidth='1'
              strokeDasharray='5,5'
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
              transition={{
                pathLength: { duration: 3, repeat: Infinity, delay: i * 0.2 },
                opacity: { duration: 3, repeat: Infinity, delay: i * 0.2 },
              }}
            />
          )
        })}
      </svg>

      {/* Radial Gradient Overlay */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(15,23,42,0.2)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(255,255,255,0.3)_100%)]'
        }`}
      />
    </div>
  )
}

