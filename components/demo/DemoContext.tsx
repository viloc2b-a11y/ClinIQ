"use client"

import { getNegotiationDealsForDemo, type NegotiationDealOption } from "@/lib/mvp/backend"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const STORAGE_STUDY = "cliniq-demo-study-key"
const STORAGE_DEAL = "cliniq-demo-deal-id"

/** Single coherent demo study; extend when multi-study demos ship. */
export const DEMO_STUDY_OPTIONS = ["STUDY-1"] as const

export type DemoStudyKey = (typeof DEMO_STUDY_OPTIONS)[number]

type DemoContextValue = {
  studyKey: string
  setStudyKey: (k: string) => void
  studyOptions: readonly string[]
  dealId: string
  setDealId: (id: string) => void
  deals: NegotiationDealOption[]
  dealsLoading: boolean
  refreshDeals: () => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function useDemoContext(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) {
    throw new Error("useDemoContext must be used within DemoProvider")
  }
  return ctx
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [studyKey, setStudyKeyState] = useState<string>(DEMO_STUDY_OPTIONS[0])
  const [dealId, setDealIdState] = useState("")
  const [deals, setDeals] = useState<NegotiationDealOption[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_STUDY)
      if (s && (DEMO_STUDY_OPTIONS as readonly string[]).includes(s)) {
        setStudyKeyState(s)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const setStudyKey = useCallback((k: string) => {
    if (!(DEMO_STUDY_OPTIONS as readonly string[]).includes(k)) return
    setStudyKeyState(k)
    try {
      localStorage.setItem(STORAGE_STUDY, k)
    } catch {
      /* ignore */
    }
  }, [])

  const setDealId = useCallback((id: string) => {
    setDealIdState(id)
    try {
      if (id) localStorage.setItem(STORAGE_DEAL, id)
      else localStorage.removeItem(STORAGE_DEAL)
    } catch {
      /* ignore */
    }
  }, [])

  const refreshDeals = useCallback(async () => {
    setDealsLoading(true)
    const res = await getNegotiationDealsForDemo(studyKey)
    const list = res.value
    setDeals(list)

    setDealIdState((prev) => {
      let saved = ""
      try {
        saved = localStorage.getItem(STORAGE_DEAL) ?? ""
      } catch {
        /* ignore */
      }
      const persist = (id: string) => {
        try {
          if (id) localStorage.setItem(STORAGE_DEAL, id)
          else localStorage.removeItem(STORAGE_DEAL)
        } catch {
          /* ignore */
        }
        return id
      }
      if (saved && list.some((d) => d.deal_id === saved)) return persist(saved)
      if (prev && list.some((d) => d.deal_id === prev)) return prev
      if (list[0]) return persist(list[0].deal_id)
      return persist("")
    })

    setDealsLoading(false)
  }, [studyKey])

  useEffect(() => {
    void refreshDeals()
  }, [refreshDeals])

  const value = useMemo<DemoContextValue>(
    () => ({
      studyKey,
      setStudyKey,
      studyOptions: DEMO_STUDY_OPTIONS,
      dealId,
      setDealId,
      deals,
      dealsLoading,
      refreshDeals,
    }),
    [studyKey, setStudyKey, dealId, setDealId, deals, dealsLoading, refreshDeals],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
