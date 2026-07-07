'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'

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
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            @thescentlab
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Follow the gallery
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {IMAGES.map((src, i) => (
            <motion.a
              key={src}
              href="#"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
            >
              <Image
                src={src}
                alt="Instagram post"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all duration-200 group-hover:bg-foreground/40 group-hover:opacity-100">
                <Instagram className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
