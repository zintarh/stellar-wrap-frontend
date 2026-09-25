initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
transition={reducedMotionTransition(prefersReducedMotion, {
  delay: 1,
})}
whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}import { useTranslations, useLocale } from "next-intl";