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

const STORAGE_DEMO_MODE = "cliniq-demo-mode"
const STORAGE_STUDY = "cliniq-active-study-key"
const STORAGE_DEAL = "cliniq-active-deal-id"

/** Single coherent demo study; extend when multi-study demos ship. */
export const DEMO_STUDY_OPTIONS = ["STUDY-1"] as const

export type DemoStudyKey = (typeof DEMO_STUDY_OPTIONS)[number]

type DemoContextValue = {
  isDemoMode: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void

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

/** Use when rendering in shells that may not mount DemoProvider (e.g. marketing pages). */
export function useMaybeDemoContext(): DemoContextValue | null {
  return useContext(DemoContext)
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [studyKey, setStudyKeyState] = useState<string>("")
  const [dealId, setDealIdState] = useState("")
  const [deals, setDeals] = useState<NegotiationDealOption[]>([])
  const [dealsLoading, setDealsLoading] = useState(false)

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const demoParam = sp.get("demo")

      const storedDemo = localStorage.getItem(STORAGE_DEMO_MODE)
      const demoOn = demoParam === "true" || storedDemo === "1"
      setIsDemoMode(demoOn)

      const s = localStorage.getItem(STORAGE_STUDY) ?? ""
      if (demoOn) {
        setStudyKeyState(
          (DEMO_STUDY_OPTIONS as readonly string[]).includes(s) ? s : DEMO_STUDY_OPTIONS[0],
        )
      } else {
        // Real mode: only load a user-selected studyKey if present.
        setStudyKeyState(s)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const setStudyKey = useCallback((k: string) => {
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

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true)
    setStudyKeyState(DEMO_STUDY_OPTIONS[0])
    setDealIdState("")
    try {
      localStorage.setItem(STORAGE_DEMO_MODE, "1")
      localStorage.setItem(STORAGE_STUDY, DEMO_STUDY_OPTIONS[0])
      localStorage.removeItem(STORAGE_DEAL)
    } catch {
      /* ignore */
    }
  }, [])

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false)
    setStudyKeyState("")
    setDealIdState("")
    setDeals([])
    setDealsLoading(false)
    try {
      localStorage.removeItem(STORAGE_DEMO_MODE)
      localStorage.removeItem(STORAGE_STUDY)
      localStorage.removeItem(STORAGE_DEAL)
    } catch {
      /* ignore */
    }
  }, [])

  const refreshDeals = useCallback(async () => {
    if (!isDemoMode) {
      setDeals([])
      setDealsLoading(false)
      return
    }
    setDealsLoading(true)
    const res = await getNegotiationDealsForDemo(studyKey, { demoMode: true })
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
  }, [isDemoMode, studyKey])

  useEffect(() => {
    void refreshDeals()
  }, [refreshDeals])

  const value = useMemo<DemoContextValue>(
    () => ({
      isDemoMode,
      enterDemoMode,
      exitDemoMode,

      studyKey,
      setStudyKey,
      studyOptions: isDemoMode ? DEMO_STUDY_OPTIONS : (studyKey ? [studyKey] : []),
      dealId,
      setDealId,
      deals,
      dealsLoading,
      refreshDeals,
    }),
    [isDemoMode, enterDemoMode, exitDemoMode, studyKey, setStudyKey, dealId, setDealId, deals, dealsLoading, refreshDeals],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
