import { useSyncExternalStore } from 'react'
import id from './locales/id.json'
import en from './locales/en.json'
import zh from './locales/zh.json'

export type Locale = 'id' | 'en' | 'zh'
const dictionaries = { id, en, zh }
const storageKey = 'lmor-language-v1'
const listeners = new Set<() => void>()
export const isLocale = (value: unknown): value is Locale =>
  value === 'id' || value === 'en' || value === 'zh'
function savedLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey)
    return isLocale(saved) ? saved : 'id'
  } catch {
    return 'id'
  }
}
let locale = savedLocale()
export const getLocale = () => locale
export const getDictionary = () => dictionaries[locale]
function applyDocumentLanguage() {
  if (typeof document !== 'undefined')
    document.documentElement.lang = getDictionary().htmlLang
}
applyDocumentLanguage()
export function setLocale(next: Locale) {
  if (!isLocale(next) || locale === next) return
  locale = next
  try {
    localStorage.setItem(storageKey, next)
  } catch {
    /* Private browsing can disable storage. */
  }
  applyDocumentLanguage()
  listeners.forEach((listener) => listener())
}
export function subscribeLocale(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getLocale, () => 'id' as Locale)
}
const templates = Object.keys(id.ui)
  .filter((key) => key.includes('{'))
  .map((key) => ({
    key,
    pattern: new RegExp(
      '^' +
        key
          .split(/(\{\w+\})/)
          .map((part) =>
            /^\{/.test(part)
              ? '(.+?)'
              : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          )
          .join('') +
        '$',
    ),
    names: [...key.matchAll(/\{(\w+)\}/g)].map((match) => match[1]),
  }))
export function translateText<T extends string | undefined>(value: T): T {
  if (!value || !value.trim()) return value
  const key = value.trim()
  const ui = getDictionary().ui as Record<string, string>
  let translated = ui[key]
  if (translated === undefined) {
    for (const template of templates) {
      const match = template.pattern.exec(key)
      if (!match) continue
      translated = ui[template.key].replace(/\{(\w+)\}/g, (_, name: string) =>
        translateText(match[template.names.indexOf(name) + 1]),
      )
      break
    }
  }
  const clean = (translated ?? key).replace(/[—–]/g, '-')
  return (value.slice(0, value.length - value.trimStart().length) +
    clean +
    value.slice(value.trimEnd().length)) as T
}
export function translateNode<T>(value: T): T {
  if (typeof value === 'string') return translateText(value) as T
  if (Array.isArray(value)) return value.map(translateNode) as T
  return value
}
