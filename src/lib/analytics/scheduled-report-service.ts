// ScheduledReportService — architecture only, per the Part 9 spec
// ("Scheduled Reports (Future)"). Stores WHICH report should run, HOW
// OFTEN, and WHO should receive it. Nothing in this codebase actually runs
// a schedule or sends an email yet — see src/lib/analytics/README.md,
// "Scheduled Reports" for the intended execution design (a future cron
// route calling the same get*Analytics()/export functions this part
// already built, then an EmailService call that doesn't exist — Resend was
// intentionally disconnected in Part 2 and hasn't been reconnected).

import { db } from '@/lib/db'
import { REPORTS, type Report } from './report-types'
import type { ScheduledReportFrequency } from '@prisma/client'

export { REPORTS }
export type { Report }

export async function listScheduledReports() {
  return db.scheduledReport.findMany({ orderBy: { createdAt: 'desc' } })
}

export interface CreateScheduledReportInput {
  report: Report
  frequency: ScheduledReportFrequency
  recipients: string[]
  createdById: string
}

export async function createScheduledReport(input: CreateScheduledReportInput) {
  return db.scheduledReport.create({
    data: {
      report: input.report,
      frequency: input.frequency,
      recipients: input.recipients,
      createdById: input.createdById,
    },
  })
}

export async function toggleScheduledReport(id: string, enabled: boolean) {
  return db.scheduledReport.update({ where: { id }, data: { enabled } })
}

export async function deleteScheduledReport(id: string) {
  await db.scheduledReport.delete({ where: { id } })
}
