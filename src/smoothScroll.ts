import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)
let engine: Lenis | undefined
let locks = 0

export function useSmoothScroll() {
  useEffect(() => {
    const instance = new Lenis({
      lerp: 0.075,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.85,
      stopInertiaOnNavigate: true,
    })
    engine = instance
    if (locks) instance.stop()
    instance.on('scroll', ScrollTrigger.update)
    const tick = (seconds: number) => instance.raf(seconds * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      if (engine === instance) engine = undefined
    }
  }, [])
}

export function scrollSmoothlyTo(
  target: HTMLElement | number,
  immediate = false,
) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (engine) {
    engine.resize()
    engine.scrollTo(target, {
      duration: 1.65,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      immediate: immediate || reduced,
    })
  } else if (typeof target === 'number') {
    window.scrollTo({
      top: target,
      behavior: immediate || reduced ? 'instant' : 'smooth',
    })
  } else {
    target.scrollIntoView({
      behavior: immediate || reduced ? 'instant' : 'smooth',
      block: 'start',
    })
  }
}

export function lockPageScroll() {
  locks++
  engine?.stop()
  return () => {
    locks = Math.max(0, locks - 1)
    if (!locks) engine?.start()
  }
}
