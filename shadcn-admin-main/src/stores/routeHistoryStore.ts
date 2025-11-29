import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RouteScenario {
    id: string
    timestamp: number
    source: string
    destination: string
    amount: number
    currency: string
    optimalRoute: {
        net: string
        friction: string
        time: string
        path: string[]
    }
}

interface RouteHistoryStore {
    scenarios: RouteScenario[]
    addScenario: (scenario: Omit<RouteScenario, 'id' | 'timestamp'>) => void
    clearHistory: () => void
}

export const useRouteHistory = create<RouteHistoryStore>()(
    persist(
        (set) => ({
            scenarios: [],
            addScenario: (scenario) =>
                set((state) => ({
                    scenarios: [
                        {
                            ...scenario,
                            id: `scenario-${Date.now()}`,
                            timestamp: Date.now(),
                        },
                        ...state.scenarios,
                    ].slice(0, 10), // Keep only last 10 scenarios
                })),
            clearHistory: () => set({ scenarios: [] }),
        }),
        {
            name: 'route-history-storage',
        }
    )
)
