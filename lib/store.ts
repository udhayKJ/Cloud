'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useMemo } from 'react'
import type { InfrastructureProfile, ProjectStatus } from './types'
import { SAMPLE_PROJECTS } from './sample-projects'
import { analyseProject } from './engine'

const STATUS_ORDER: Record<ProjectStatus, number> = { draft: 0, analysed: 1, simulated: 2 }

interface ProjectState {
  projects: InfrastructureProfile[]
  activeId: string
  setActive: (id: string) => void
  addProject: (p: InfrastructureProfile) => void
  updateActive: (patch: Partial<InfrastructureProfile>) => void
  setStatus: (id: string, status: ProjectStatus) => void
  /** Moves a project forward through the pipeline; never downgrades its status. */
  advanceStatus: (id: string, status: ProjectStatus) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: SAMPLE_PROJECTS,
      activeId: SAMPLE_PROJECTS[0].id,
      setActive: (id) => set({ activeId: id }),
      addProject: (p) => set((s) => ({ projects: [p, ...s.projects], activeId: p.id })),
      updateActive: (patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === s.activeId ? { ...p, ...patch } : p)),
        })),
      setStatus: (id, status) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)) })),
      advanceStatus: (id, status) =>
        set((s) => {
          const target = s.projects.find((p) => p.id === id)
          if (!target || STATUS_ORDER[target.status] >= STATUS_ORDER[status]) return s
          return { projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)) }
        }),
      deleteProject: (id) =>
        set((s) => {
          // The whole console depends on an active project, so the last one cannot be removed.
          if (s.projects.length <= 1) return s
          const projects = s.projects.filter((p) => p.id !== id)
          return { projects, activeId: s.activeId === id ? projects[0].id : s.activeId }
        }),
    }),
    {
      name: 'cloudshift-projects',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ projects: s.projects, activeId: s.activeId }),
      // Rehydrated manually after mount (see AppShell) so server and first client render match.
      skipHydration: true,
      merge: (persisted, current) => {
        const p = persisted as Partial<ProjectState> | undefined
        if (!p || !Array.isArray(p.projects) || p.projects.length === 0) return current
        const activeId = p.projects.some((x) => x.id === p.activeId) ? p.activeId! : p.projects[0].id
        return { ...current, projects: p.projects, activeId }
      },
    },
  ),
)

export function useActiveProject() {
  const projects = useProjectStore((s) => s.projects)
  const activeId = useProjectStore((s) => s.activeId)
  return projects.find((p) => p.id === activeId) ?? projects[0]
}

export function useAnalysis() {
  const profile = useActiveProject()
  return useMemo(() => analyseProject(profile), [profile])
}
