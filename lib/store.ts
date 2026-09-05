'use client'

import { create } from 'zustand'
import { useMemo } from 'react'
import type { InfrastructureProfile, ProjectStatus } from './types'
import { SAMPLE_PROJECTS } from './sample-projects'
import { analyseProject } from './engine'

interface ProjectState {
  projects: InfrastructureProfile[]
  activeId: string
  setActive: (id: string) => void
  addProject: (p: InfrastructureProfile) => void
  updateActive: (patch: Partial<InfrastructureProfile>) => void
  setStatus: (id: string, status: ProjectStatus) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
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
  deleteProject: (id) =>
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id)
      return { projects, activeId: s.activeId === id ? (projects[0]?.id ?? '') : s.activeId }
    }),
}))

export function useActiveProject() {
  const projects = useProjectStore((s) => s.projects)
  const activeId = useProjectStore((s) => s.activeId)
  return projects.find((p) => p.id === activeId) ?? projects[0]
}

export function useAnalysis() {
  const profile = useActiveProject()
  return useMemo(() => analyseProject(profile), [profile])
}
