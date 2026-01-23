"use client"
import { motion } from "framer-motion"
import { Activity, Share2, Zap } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant Insights",
    description: "Connect your wallet and get instant analysis of your on-chain activity."
  },
  {
    icon: Activity,
    title: "Deep Analytics",
    description: "Visualize your transaction history, asset growth, and network participation."
  },
  {
    icon: Share2,
    title: "Shareable Cards",
    description: "Generate beautiful, shareable cards to show off your stellar year."
  }
]

export function FeatureSection() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-[var(--color-theme-primary)] transition-colors group backdrop-blur-sm"
          >
            <feature.icon className="w-10 h-10 text-[var(--color-theme-primary)] mb-4 drop-shadow-[0_0_8px_rgba(var(--color-theme-primary-rgb),0.5)]" />
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[var(--color-theme-primary)] transition-colors">
              {feature.title}
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
