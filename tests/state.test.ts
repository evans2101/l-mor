import { describe, it, expect } from 'vitest'
import { addItems, itemKey, readState, totals } from '../src/state'
import { defaultTop, defaultBottom } from '../src/data'
describe('browser persistence safety', () => {
  it('recovers from corrupt JSON and outdated data', () => {
    expect(readState('{bad').cart).toEqual([])
    expect(readState('{"version":2}').body.height).toBe(175)
  })
  it('discards removed products and invalid variants while keeping valid bag entries', () => {
    const cart = [
      { ...defaultTop, quantity: 2 },
      { ...defaultTop, id: 'removed', quantity: 1 },
      { ...defaultTop, color: 500, quantity: 1 },
      { ...defaultBottom, quantity: -1 },
    ]
    const restored = readState(
      JSON.stringify({
        version: 1,
        cart,
        favorites: ['essential-tee', 'removed', 'essential-tee'],
        top: defaultBottom,
        body: { gender: 'male', skin: 1, height: 900, weight: -50 },
      }),
    )
    expect(restored.cart).toEqual([{ ...defaultTop, quantity: 2 }])
    expect(restored.favorites).toEqual(['essential-tee'])
    expect(restored.top).toEqual(defaultTop)
    expect(restored.body).toMatchObject({ height: 205, weight: 40 })
  })
  it('drops corrupt saved looks', () => {
    expect(
      readState(
        JSON.stringify({
          version: 1,
          looks: [
            {
              id: 'bad',
              top: defaultTop,
              bottom: defaultBottom,
              body: { skin: 99 },
            },
          ],
        }),
      ).looks,
    ).toEqual([])
  })
})
describe('bag and pricing', () => {
  it('merges identical variants, keeps sizes separate, caps quantities', () => {
    const result = addItems(
      [{ ...defaultTop, quantity: 19 }],
      [defaultTop, defaultTop, { ...defaultTop, size: 'L' }, defaultBottom],
    )
    expect(result).toHaveLength(3)
    expect(result[0].quantity).toBe(20)
    expect(itemKey(result[1])).not.toBe(itemKey(defaultTop))
  })
  it('calculates shipping against subtotal, with a valid discount', () => {
    expect(totals([{ ...defaultTop, quantity: 1 }])).toEqual({
      subtotal: 189000,
      discount: 0,
      shipping: 20000,
      total: 209000,
    })
    expect(
      totals(
        [
          { ...defaultTop, quantity: 1 },
          { ...defaultBottom, quantity: 1 },
        ],
        'LMOR10',
      ),
    ).toEqual({ subtotal: 588000, discount: 58800, shipping: 0, total: 529200 })
    expect(totals([], 'LMOR10').total).toBe(0)
    expect(totals([{ ...defaultTop, quantity: 1 }], 'INVALID').discount).toBe(0)
  })
})
