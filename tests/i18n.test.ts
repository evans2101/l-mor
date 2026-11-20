import { afterEach, describe, expect, it } from 'vitest'
import {
  getLocale,
  isLocale,
  setLocale,
  translateNode,
  translateText,
} from '../src/i18n'
import id from '../src/locales/id.json'
import en from '../src/locales/en.json'
import zh from '../src/locales/zh.json'

afterEach(() => setLocale('id'))
describe('local dictionaries', () => {
  it('has matching authored entries and narration in all three languages', () => {
    for (const dictionary of [id, en, zh]) {
      expect(Object.keys(dictionary.ui).sort()).toEqual(
        Object.keys(id.ui).sort(),
      )
      expect(
        Object.values(dictionary.ui).every((value) => value.trim().length > 0),
      ).toBe(true)
      expect(dictionary.hero.narration.length).toBeGreaterThan(20)
      expect(JSON.stringify(dictionary)).not.toMatch(/[—–]/)
    }
  })
  it('translates product templates and preserves React values and spaces', () => {
    setLocale('zh')
    expect(translateText('Pakai Essential Oversized Tee')).toBe(
      '试穿 Essential 宽松 T 恤',
    )
    expect(translateText('Shopping bag, 2 produk')).toBe('购物袋，共 2 件商品')
    expect(translateText(' Lihat koleksi ')).toBe(' 浏览系列 ')
    expect(translateNode([0, false, 'Koleksi'])).toEqual([0, false, '精选系列'])
    expect(translateText(' ')).toBe(' ')
  })
  it('rejects unsupported language codes and retains a readable fallback', () => {
    expect(isLocale('zh-CN')).toBe(false)
    expect(isLocale('zh')).toBe(true)
    setLocale('en')
    expect(getLocale()).toBe('en')
    expect(translateText('Tinggi badan')).toBe('Height')
    expect(translateText('L’MOR')).toBe('L’MOR')
  })
})
