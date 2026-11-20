import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'

export type HomeSection = 'intro' | 'studio' | 'about'
let currentSection: HomeSection = 'intro'
let navigateScene: ((section: HomeSection) => void) | undefined
const subscribers = new Set<() => void>()
const subscribe = (listener: () => void) => {
  subscribers.add(listener)
  return () => {
    subscribers.delete(listener)
  }
}
const snapshot = () => currentSection

export function publishHomeSection(section: HomeSection) {
  if (currentSection === section) return
  currentSection = section
  subscribers.forEach((listener) => listener())
}

export function registerSceneNavigation(
  navigate: (section: HomeSection) => void,
  initial: HomeSection,
) {
  navigateScene = navigate
  publishHomeSection(initial)
  return () => {
    if (navigateScene === navigate) navigateScene = undefined
  }
}

// Existing links keep working; home navigation now swaps layers in one viewport.
export function scrollToSection(section: HomeSection) {
  navigateScene?.(section)
}

export function useHomeSection() {
  const { pathname } = useLocation()
  const section = useSyncExternalStore(subscribe, snapshot, snapshot)
  return pathname === '/' ? section : null
}
