const assert = require('assert')
const { describe, it } = require('mocha')
const CachedCall = require('../src/CachedCall')
const cache = new CachedCall()
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('CachedCall', () => {
  const now = () => Date.now()
  const asyncFunction = (x, time = 100) => wait(time).then(() => x)
  const cached = {
    now: cache({ now, maxAge: 5000 }),
    asyncFunction: cache({ asyncFunction, maxAge: 5000 })
  }
  it('should cache the result', async () => {
    const { now } = cached
    const timestamp = now()
    await wait(200)
    assert.strictEqual(timestamp, now())
    assert.notStrictEqual(timestamp, Date.now())
  })
  it('should work with async funciton', async () => {
    const value = 33
    const ret = await cached.asyncFunction(value)
    assert.strictEqual(ret, value)
    await wait(200)
    assert.strictEqual(33, await cached.asyncFunction(value))
  })
})
