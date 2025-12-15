import { create } from 'zustand'

interface CallSummary {
  callId: string
  summary: string
  phoneNumber?: string
  date?: string
  status?: string
  loading?: boolean
}

interface CallSummaryStore {
  selectedCall: CallSummary | null
  setSelectedCall: (call: CallSummary | null) => void
  clearSelectedCall: () => void
}

export const useCallSummaryStore = create<CallSummaryStore>((set) => ({
  selectedCall: null,
  setSelectedCall: (call) => set({ selectedCall: call }),
  clearSelectedCall: () => set({ selectedCall: null }),
}))

