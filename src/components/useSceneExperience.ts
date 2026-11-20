import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import {
  publishHomeSection,
  registerSceneNavigation,
  type HomeSection,
} from '../navigation'

const chapters: HomeSection[] = ['intro', 'studio', 'about']
const control = 'input,select,textarea,[contenteditable="true"],dialog'

function canScrollWithin(
  target: EventTarget | null,
  root: HTMLElement,
  direction: number,
) {
  let node = target instanceof Element ? target : null
  while (node && node !== root) {
    if (node instanceof HTMLElement) {
      const style = getComputedStyle(node)
      if (
        /(auto|scroll)/.test(style.overflowY) &&
        node.scrollHeight > node.clientHeight + 2
      ) {
        if (
          direction > 0 &&
          node.scrollTop + node.clientHeight < node.scrollHeight - 2
        )
          return true
        if (direction < 0 && node.scrollTop > 2) return true
      }
    }
    node = node.parentElement
  }
  return false
}

export default function useSceneExperience(
  root: RefObject<HTMLElement | null>,
  initial: HomeSection,
) {
  const [active, setActive] = useState(initial)
  const [transitioning, setTransitioning] = useState(false)
  const [loadLogo, setLoadLogo] = useState(initial === 'about')
  const current = useRef(initial),
    journey = useRef(0),
    logoProgress = useRef(0.5)

  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    document.documentElement.classList.add('experience-mode')
    document.body.classList.add('experience-mode')
    window.scrollTo({ top: 0, behavior: 'instant' })
    const layers = chapters.map((id) =>
      element.querySelector<HTMLElement>(`[data-scene="${id}"]`)!,
    )
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let motion: gsap.core.Timeline | undefined
    let focusFrame = 0
    let busy = false,
      needsNewGesture = false,
      lastWheel = 0,
      amount = 0
    let touch:
      | { x: number; y: number; target: EventTarget | null; native: boolean }
      | undefined
    gsap.set(layers, { autoAlpha: 0, filter: 'blur(0px)', scale: 1 })
    gsap.set(layers[chapters.indexOf(initial)], { autoAlpha: 1 })

    const change = (next: HomeSection) => {
      const nextLayer = layers[chapters.indexOf(next)]
      if (current.current === next) {
        nextLayer.querySelector<HTMLElement>('[data-scene-scroll]')?.scrollTo({
          top: 0,
          behavior: reduced.matches ? 'instant' : 'smooth',
        })
        return
      }
      const previous = layers[chapters.indexOf(current.current)]
      const moveFocus = previous.contains(document.activeElement)
      cancelAnimationFrame(focusFrame)
      motion?.kill()
      current.current = next
      setActive(next)
      publishHomeSection(next)
      if (next === 'about') setLoadLogo(true)
      needsNewGesture = true
      amount = 0
      const others = layers.filter((layer) => layer !== nextLayer)
      const finish = () => {
        gsap.set(others, {
          autoAlpha: 0,
          filter: 'blur(0px)',
          scale: 1,
          willChange: 'auto',
        })
        gsap.set(nextLayer, {
          autoAlpha: 1,
          filter: 'blur(0px)',
          scale: 1,
          willChange: 'auto',
        })
        busy = false
        setTransitioning(false)
        if (moveFocus) {
          cancelAnimationFrame(focusFrame)
          focusFrame = requestAnimationFrame(() =>
            nextLayer
              .querySelector<HTMLElement>('h1,h2')
              ?.focus({ preventScroll: true }),
          )
        }
      }
      if (reduced.matches) {
        finish()
        return
      }
      busy = true
      setTransitioning(true)
      const blur = innerWidth < 700 ? 6 : 10
      const entering = getComputedStyle(nextLayer).visibility !== 'visible'
      gsap.set(layers, { willChange: 'opacity, filter, transform' })
      gsap.set(nextLayer, {
        ...(entering
          ? { opacity: 0, filter: `blur(${blur + 2}px)`, scale: 1.025 }
          : {}),
        visibility: 'visible',
        zIndex: 2,
      })
      gsap.set(others, { zIndex: 1 })
      motion = gsap
        .timeline({ onComplete: finish })
        .to(
          others,
          {
            opacity: 0,
            filter: `blur(${blur}px)`,
            scale: 0.985,
            duration: 0.5,
            ease: 'power2.inOut',
          },
          0,
        )
        .to(
          nextLayer,
          {
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 0.78,
            ease: 'power3.out',
          },
          0.18,
        )
        .to(
          journey,
          {
            current: next === 'intro' ? 0 : 0.2,
            duration: 0.8,
            ease: 'power2.inOut',
          },
          0,
        )
      if (next === 'about')
        motion.fromTo(
          logoProgress,
          { current: 0.1 },
          { current: 0.8, duration: 1.25, ease: 'power2.out' },
          0,
        )
    }
    const step = (direction: number) => {
      const index = chapters.indexOf(current.current)
      const next =
        chapters[Math.max(0, Math.min(chapters.length - 1, index + direction))]
      if (next !== current.current) change(next)
    }
    const blocked = (target: EventTarget | null) =>
      !!document.querySelector('dialog[open]') ||
      (target instanceof Element && !!target.closest(control))
    const wheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        blocked(event.target)
      ) {
        return
      }
      const now = performance.now(),
        gap = now - lastWheel
      lastWheel = now
      const direction = Math.sign(event.deltaY)
      if (!direction) return
      if (!busy && canScrollWithin(event.target, element, direction)) {
        amount = 0
        needsNewGesture = true
        return
      }
      event.preventDefault()
      if (busy || (needsNewGesture && gap < 180)) return
      if (gap > 180 || amount * direction < 0) amount = 0
      needsNewGesture = false
      amount +=
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
      if (Math.abs(amount) >= 80) step(direction)
    }
    const touchStart = (event: TouchEvent) => {
      touch = undefined
      if (
        event.touches.length !== 1 ||
        blocked(event.target) ||
        (event.target instanceof Element && event.target.closest('canvas'))
      )
        return
      const point = event.touches[0]
      touch = {
        x: point.clientX,
        y: point.clientY,
        target: event.target,
        native: false,
      }
    }
    const touchMove = (event: TouchEvent) => {
      if (!touch) return
      if (event.touches.length !== 1) {
        touch = undefined
        return
      }
      const point = event.touches[0],
        dy = touch.y - point.clientY,
        dx = touch.x - point.clientX
      if (Math.abs(dy) < Math.abs(dx)) return
      if (!busy && canScrollWithin(touch.target, element, Math.sign(dy))) {
        touch.native = true
        return
      }
      if (!touch.native) event.preventDefault()
    }
    const touchEnd = (event: TouchEvent) => {
      if (!touch) return
      const point = event.changedTouches[0],
        dy = touch.y - point.clientY,
        dx = touch.x - point.clientX
      if (
        !busy &&
        !touch.native &&
        Math.abs(dy) > 55 &&
        Math.abs(dy) > Math.abs(dx) * 1.2
      )
        step(Math.sign(dy))
      touch = undefined
    }
    const touchCancel = () => {
      touch = undefined
    }
    const keys = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        blocked(event.target) ||
        (event.target instanceof Element && event.target.closest('button,a'))
      )
        return
      const direction =
        event.key === 'ArrowDown' ||
        event.key === 'PageDown' ||
        (event.key === ' ' && !event.shiftKey)
          ? 1
          : event.key === 'ArrowUp' ||
              event.key === 'PageUp' ||
              (event.key === ' ' && event.shiftKey)
            ? -1
            : 0
      if (direction && canScrollWithin(event.target, element, direction)) return
      if (direction || event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        if (busy) return
        if (event.key === 'Home') change('intro')
        else if (event.key === 'End') change('about')
        else step(direction)
      }
    }
    const unregister = registerSceneNavigation(change, initial)
    element.addEventListener('wheel', wheel, { passive: false })
    element.addEventListener('touchstart', touchStart, { passive: true })
    element.addEventListener('touchmove', touchMove, { passive: false })
    element.addEventListener('touchend', touchEnd)
    element.addEventListener('touchcancel', touchCancel)
    window.addEventListener('keydown', keys)
    return () => {
      unregister()
      motion?.kill()
      cancelAnimationFrame(focusFrame)
      gsap.killTweensOf([journey, logoProgress])
      gsap.set(layers, { clearProps: 'all' })
      element.removeEventListener('wheel', wheel)
      element.removeEventListener('touchstart', touchStart)
      element.removeEventListener('touchmove', touchMove)
      element.removeEventListener('touchend', touchEnd)
      element.removeEventListener('touchcancel', touchCancel)
      window.removeEventListener('keydown', keys)
      document.documentElement.classList.remove('experience-mode')
      document.body.classList.remove('experience-mode')
    }
  }, [root, initial])
  return { active, transitioning, loadLogo, journey, logoProgress }
}
