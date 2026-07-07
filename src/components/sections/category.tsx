'use client'

import { categories } from '@/lib/data'
import { CategoryCard } from '@/components/site/category-card'
import Link from 'next/link'
import { SectionHeading } from '@/components/site/section-heading'

export function CategorySection() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          className="mb-8"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.slug}
              href={`/${cat.slug}`}
              name={cat.name}
              description={cat.description}
              image={cat.image}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
