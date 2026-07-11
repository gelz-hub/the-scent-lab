'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Truck, Package } from 'lucide-react'

const ease: readonly [number, number, number, number] = [0.22, 1, 0.36, 1]

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const child = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
}

interface HeroSectionProps {
  brandCount?: number
  productCount?: number
}

export function HeroSection({ brandCount = 0, productCount = 0 }: HeroSectionProps) {
  const stats = [
    ...(brandCount > 0 ? [{ icon: ShieldCheck, value: `${brandCount}+`, label: 'Houses' }] : []),
    ...(productCount > 0 ? [{ icon: Package, value: `${productCount}+`, label: 'Fragrances' }] : []),
    { icon: Truck, value: '100%', label: 'Authentic' },
  ]
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.25, 0.45])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-border"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:min-h-[700px]">
        {/* ── Copy Column ────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="order-2 py-14 lg:order-1 lg:py-24 lg:pr-12 xl:pr-20"
        >
          <motion.p
            variants={child}
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            Curated · Authentic · Worldwide
          </motion.p>

          <motion.h1
            variants={child}
            className="mt-5 font-display text-6xl font-medium leading-[0.97] tracking-tight sm:text-7xl md:text-8xl lg:text-[5.5rem] xl:text-[6.25rem]"
          >
            Discover your
            <br />
            <span className="italic text-brand">signature</span> scent.
          </motion.h1>

          <motion.p
            variants={child}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            A considered edit of authentic fragrances from the world&apos;s
            finest perfume houses. No noise. Just scent.
          </motion.p>

          <motion.div
            variants={child}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-7 py-4 text-sm font-medium text-background shadow-sm transition-all duration-300 hover:bg-brand hover:text-brand-foreground hover:shadow-md hover:shadow-brand/20"
            >
              Shop the edit
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-7 py-4 text-sm font-medium transition-all duration-300 hover:border-foreground/30 hover:bg-surface"
            >
              Explore collections
            </Link>
          </motion.div>

          {/* ── Floating stat pills ───────────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mt-12 flex flex-wrap gap-3"
          >
            {stats.map(({ icon: Icon, value, label }) => (
              <motion.div
                key={label}
                variants={child}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-brand">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-display text-xl font-medium leading-none">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Image Column ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0 0 0%)' }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-1 aspect-[4/3] lg:order-2 lg:aspect-auto lg:h-[700px]"
        >
          {/* Abstract, brand-neutral visual — no product photography until
              real catalog imagery exists (see admin-managed hero banners,
              Phase 2). */}
          <motion.div
            style={{ y: imageY, scale: imageScale }}
            className="absolute inset-0 bg-gradient-to-br from-accent via-surface to-background"
          >
            <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,theme(colors.brand/25),transparent_55%),radial-gradient(circle_at_75%_65%,theme(colors.brand/15),transparent_50%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-[13vw] font-medium italic text-foreground/[0.06] lg:text-[7vw]">
                The Scent Lab
              </span>
            </div>
          </motion.div>
          {/* Gradient overlay for depth */}
          <motion.div
            style={{ opacity: overlayOpacity }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background/30"
          />
          {/* Soft bottom fade on mobile */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent lg:hidden" />
        </motion.div>
      </div>
    </section>
  )
}
