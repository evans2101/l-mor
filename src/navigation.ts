import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollSmoothlyTo } from './smoothScroll'

export type HomeSection = 'intro' | 'studio' | 'about'

export function scrollToSection(id: HomeSection) {
  const target = document.getElementById(id)
  if (target) scrollSmoothlyTo(target)
}

// The visible section determines navigation state, even after manual scrolling.
export function useHomeSection() {
  const { pathname } = useLocation()
  const [section, setSection] = useState<HomeSection>('intro')
  useEffect(() => {
    if (pathname !== '/') return
    let frame = 0
    const update = () => {
      frame = 0
      const marker = innerHeight * 0.45
      let current: HomeSection = 'intro'
      for (const id of ['studio', 'about'] as const) {
        const target = document.getElementById(id)
        if (target && target.getBoundingClientRect().top <= marker) current = id
      }
      setSection(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [pathname])
  return pathname === '/' ? section : null
}
