import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  href: string
  name: string
  description: string
  image: string | null
  index?: number
  size?: 'default' | 'large'
}

export function CategoryCard({
  href,
  name,
  description,
  image,
  index = 0,
  size = 'default',
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className={cn(
          'group relative block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-lg',
          size === 'large' ? 'aspect-[4/5]' : 'aspect-[4/5]',
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-8 transition-transform duration-700 ease-out-expo group-hover:scale-[1.08]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface to-border" />
        )}
        {/* Deeper gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3
                className={cn(
                  'font-display font-medium tracking-tight',
                  size === 'large' ? 'text-3xl' : 'text-2xl',
                )}
              >
                {name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {description}
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur transition-all duration-300 group-hover:bg-brand group-hover:text-brand-foreground group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
