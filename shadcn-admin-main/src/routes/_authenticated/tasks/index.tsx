import { createFileRoute } from '@tanstack/react-router'
import { LatestGenerations } from '@/features/latest-generations'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: LatestGenerations,
})
