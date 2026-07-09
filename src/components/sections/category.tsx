'use client'

import { categories } from '@/lib/data'
import { CategoryCard } from '@/components/site/category-card'
import { SectionHeading } from '@/components/site/section-heading'

export function CategorySection() {
  return (
    <section className="section-divider-soft py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Explore our complete fragrance catalogue — curated for women, men, and everyone."
          className="mb-10"
        />
        <div className="grid gap-5 md:grid-cols-3">
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
