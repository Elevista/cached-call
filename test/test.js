const assert = require('assert')
const { describe, it } = require('mocha')
const CachedCall = require('../src/CachedCall')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const errorAfter = ms => wait(ms).then(() => { throw Error(`${ms} error`) })
const object = () => ({})

describe('CachedCall', () => {
  const cache = new CachedCall()
  const asyncFunction = (x, time = 100) => wait(time).then(() => x)
  const cached = {
    object: cache({ object, maxAge: 10 }),
    asyncFunction: cache({ asyncFunction, maxAge: 5000 })
  }

  it('should cache the result', async () => {
    const { object } = cached
    const obj = object()
    assert.strictEqual(obj, object())
    await wait(200)
    assert.notStrictEqual(obj, object())
  })
  it('should work with async funciton', async () => {
    const value = 33
    assert.strictEqual(value, await cached.asyncFunction(value))
    await wait(200)
    assert.strictEqual(value, await cached.asyncFunction(value))
  })

  it('should expire after maxAge', async () => {
    const fn = cache({ object, maxAge: 100 })
    const obj = fn()
    await wait(10)
    assert.strictEqual(obj, fn())
    await wait(100)
    assert.notStrictEqual(obj, fn())
  })

  it('should not share same cache with different options', async () => {
    const { object } = cached
    const cache = new CachedCall()
    const opt1 = cache({ object, maxAge: 100 })
    const opt2 = cache({ object, maxAge: 300 })
    assert.strictEqual(opt1(), opt2())
    await wait(200)
    assert.notStrictEqual(opt1(), opt2())
  })

  it('should cache error if has cacheError option', async () => {
    const fn = cache({ errorAfter, cacheError: 200, maxAge: 500 })
    const e = e => e
    const err = await fn(10).catch(e)
    await wait(100)
    assert.strictEqual(err, await fn(10).catch(e))
    await wait(100)
    assert.notStrictEqual(err, await fn(10).catch(e))
  })

  it('should support key function', async () => {
    const key = (a1, a2) => [a1, a2]
    const withKey = cache({ object, key, maxAge: 500 })
    const without = cache({ object, maxAge: 500 })
    assert.strictEqual(withKey(1, 2, 3, 4), withKey(1, 2, 1, 2))
    assert.notStrictEqual(without(1, 2, 3, 4), without(1, 2, 1, 2))
  })
})
