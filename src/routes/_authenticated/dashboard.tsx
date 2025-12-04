import { createFileRoute } from '@tanstack/react-router'
import { AuroraDashboard } from '@/features/aurora-dashboard'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: AuroraDashboard,
})
