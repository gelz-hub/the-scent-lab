import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

interface CategoryCardProps {
  href: string
  name: string
  description: string
  image: string
  index?: number
}

export function CategoryCard({ href, name, description, image, index = 0 }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={href}
        className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-border bg-surface"
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-display text-2xl font-medium">{name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur transition-transform duration-200 group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
