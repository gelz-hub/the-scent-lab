import { Download } from 'lucide-react'

/** Consistent "Export CSV" link for every admin list page — see src/lib/rbac/README.md, "Export". */
export function ExportCsvLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:border-foreground/40"
    >
      <Download className="h-4 w-4" strokeWidth={1.5} />
      Export CSV
    </a>
  )
}
