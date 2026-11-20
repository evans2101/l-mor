import { useEffect, useState } from 'react'
import { getDictionary, useLocale } from '../i18n'
import { speakHero, stopNarration, useSound } from '../sound'

export default function HeroTitle({ active }: { active: boolean }) {
  const locale = useLocale()
  const sound = useSound()
  const { hero, htmlLang } = getDictionary()
  const [length, setLength] = useState(0)
  const first = Array.from(hero.lineOne)
  const second = Array.from(hero.lineTwo)
  const total = first.length + second.length
  useEffect(() => {
    if (!active) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) {
      setLength(total)
      return
    }
    setLength(0)
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const count = Math.min(
        total,
        Math.floor((now - started) / (locale === 'zh' ? 180 : 105)),
      )
      setLength(count)
      if (count < total) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, locale, total])
  useEffect(() => {
    if (!active || !sound) return
    const timer = window.setTimeout(
      () => speakHero(hero.narration, htmlLang),
      260,
    )
    const hide = () => {
      if (document.hidden) stopNarration()
    }
    document.addEventListener('visibilitychange', hide)
    return () => {
      clearTimeout(timer)
      stopNarration()
      document.removeEventListener('visibilitychange', hide)
    }
  }, [active, sound, locale, hero.narration, htmlLang])
  return (
    <h1
      className="story-heading typing-heading"
      tabIndex={-1}
      aria-label={`${hero.lineOne} ${hero.lineTwo} ${hero.motto}`}
      data-typing={length < total}
    >
      <span className="typing-line" aria-hidden="true">
        <span className="typing-reserve">{hero.lineOne}</span>
        <span className="typing-ink">{first.slice(0, length).join('')}</span>
      </span>
      <span className="typing-line outline-text" aria-hidden="true">
        <span className="typing-reserve">{hero.lineTwo}</span>
        <span className="typing-ink">
          {second.slice(0, Math.max(0, length - first.length)).join('')}
          <i className="typing-cursor" />
        </span>
      </span>
    </h1>
  )
}
