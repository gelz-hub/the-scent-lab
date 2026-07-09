'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Instagram, Heart } from 'lucide-react'

const IMAGES = [
  '/images/insta-1.png',
  '/images/insta-2.png',
  '/images/products/p-mfk-baccarat.png',
  '/images/products/p-lelabo-santal.png',
  '/images/products/p-tomford-blackorchid.png',
  '/images/products/p-chanel-no5.png',
]

export function InstagramSection() {
  return (
    <section className="section-divider-soft py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            @thescentlab
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Follow the gallery
          </h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-danger" fill="currentColor" strokeWidth={0} />
            <span>24.5k followers on Instagram</span>
          </div>
        </motion.div>

        {/* Varied grid: 2 large + 4 small on desktop */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {IMAGES.map((src, i) => {
            const isLarge = i < 2
            return (
              <motion.a
                key={src}
                href="#"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm ${
                  isLarge ? 'col-span-1 sm:col-span-1 lg:col-span-3' : ''
                } aspect-square`}
              >
                <Image
                  src={src}
                  alt="Instagram post"
                  fill
                  sizes={
                    isLarge
                      ? '(max-width: 1024px) 50vw, 25vw'
                      : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw'
                  }
                  className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-110"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/0 opacity-0 transition-all duration-300 group-hover:bg-foreground/40 group-hover:opacity-100">
                  <Instagram className="h-7 w-7 text-white" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-white">View</span>
                </div>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
