import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import clsx from 'clsx'
import { TrendingUp } from 'lucide-react'

// Animated counter hook
function useCountUp(target, duration = 1.2, inView = true) {
  const count = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0
    const controls = animate(count, num, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [target, inView, count, duration])

  return count
}

// Format display value preserving non-numeric suffixes
function formatValue(rawValue, motionVal) {
  // If the value is purely numeric-ish, animate it; else show raw
  const num = parseFloat(String(rawValue).replace(/[^0-9.]/g, ''))
  const suffix = String(rawValue).replace(/[0-9.,]/g, '')
  return { num, suffix, isNumeric: !isNaN(num) }
}

function AnimatedNumber({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const { num, suffix, isNumeric } = formatValue(value)
  const count = useCountUp(num, 1.2, inView && isNumeric)
  const display = useTransform(count, (v) =>
    isNumeric
      ? `${Math.round(v).toLocaleString()}${suffix}`
      : value
  )

  return (
    <motion.span ref={ref} style={isNumeric ? { fontVariantNumeric: 'tabular-nums' } : {}}>
      {isNumeric ? (
        <motion.span>{display}</motion.span>
      ) : (
        value
      )}
    </motion.span>
  )
}

const CARD_THEMES = {
  blue:   { accent: '#2563EB', gradient: 'from-blue-500/10 via-blue-400/5 to-transparent',   icon: 'bg-blue-50 text-blue-600',   glow: 'shadow-blue-500/20' },
  green:  { accent: '#22C55E', gradient: 'from-green-500/10 via-green-400/5 to-transparent',  icon: 'bg-green-50 text-green-600', glow: 'shadow-green-500/20' },
  red:    { accent: '#EF4444', gradient: 'from-red-500/10 via-red-400/5 to-transparent',      icon: 'bg-red-50 text-red-600',     glow: 'shadow-red-500/20' },
  purple: { accent: '#8B5CF6', gradient: 'from-purple-500/10 via-purple-400/5 to-transparent', icon: 'bg-purple-50 text-purple-600', glow: 'shadow-purple-500/20' },
  amber:  { accent: '#F59E0B', gradient: 'from-amber-500/10 via-amber-400/5 to-transparent',  icon: 'bg-amber-50 text-amber-600', glow: 'shadow-amber-500/20' },
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  onClick,
  // New: color theme key – 'blue' | 'green' | 'red' | 'purple' | 'amber'
  theme = 'blue',
  // Legacy support: iconColor / iconBg still accepted but override with theme
  iconColor,
  iconBg,
  trend,     // optional: { value: '+12%', positive: true }
}) {
  const isClickable = !!onClick
  const t = CARD_THEMES[theme] || CARD_THEMES.blue

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: isClickable ? -4 : -2, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 flex flex-col gap-3',
        'shadow-[0_1px_4px_0_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.05)]',
        'hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]',
        'transition-shadow duration-300',
        isClickable ? 'cursor-pointer select-none' : 'select-none',
      )}
    >
      {/* Ambient gradient background */}
      <div
        className={clsx('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none', t.gradient)}
      />

      {/* Top accent bar that animates in on hover */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl origin-left"
        style={{ backgroundColor: t.accent }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      {/* Icon + Trend Row */}
      <div className="flex items-start justify-between">
        {/* Icon */}
        <motion.div
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200',
            iconBg || t.icon.split(' ')[0],
          )}
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        >
          {Icon && (
            <Icon
              size={19}
              className={clsx('shrink-0', iconColor || t.icon.split(' ')[1])}
              strokeWidth={2}
            />
          )}
        </motion.div>

        {/* Trend Badge */}
        {trend && (
          <span
            className={clsx(
              'flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full',
              trend.positive
                ? 'text-green-700 bg-green-50'
                : 'text-red-600 bg-red-50'
            )}
          >
            <TrendingUp size={9} className={clsx(!trend.positive && 'rotate-180')} />
            {trend.value}
          </span>
        )}
      </div>

      {/* Text block */}
      <div className="flex flex-col gap-1">
        {/* Label */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>

        {/* Big Value */}
        <p className="text-[26px] font-bold text-slate-800 tracking-tight leading-none">
          <AnimatedNumber value={value} />
        </p>

        {/* Sub-label */}
        {sub && (
          <p className="text-[11px] text-slate-400 font-medium truncate leading-none">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  )
}
