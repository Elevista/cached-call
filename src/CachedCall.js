const LRU = require('lru-cache')
const isFunction = fn => typeof fn === 'function'
const isPromise = v => typeof v.then === 'function'
module.exports = function CachedCall () {
  const caches = {}
  return option => function (...args) {
    if (isFunction(option)) option = { [option.name || 'fn']: option }
    const { maxAge, max, stale, key: keyFn, cacheError, ...rest } = option
    const options = JSON.stringify({ maxAge, max, stale })
    const cache = caches[options] || (caches[options] = new LRU(JSON.parse(options)))
    const [fname] = Object.keys(rest)
    const key = JSON.stringify([fname].concat(isFunction(keyFn) ? keyFn(...args) : (keyFn || args)))
    const cached = cache.get(key)
    const { resolved, rejected } = cached || NaN
    if (resolved) return resolved
    const timestamp = Date.now()
    const getMaxAge = value => {
      if (maxAge >= 0 || !isFunction(maxAge)) return
      return maxAge.call(this, value, ...args)
    }
    const set = (value, age) => {
      const { maxAge = age } = { maxAge: getMaxAge(value) }
      if (maxAge !== false) cache.set(key, value, maxAge)
    }
    if (rejected && timestamp < (cached.timestamp + cacheError)) {
      if (cached.isPromise) return Promise.reject(rejected)
      throw rejected
    }
    const on = {
      success (resolved, isPromise = false) {
        set({ resolved, timestamp, isPromise })
        return resolved
      },
      error (rejected, isPromise = false) {
        if (cacheError > 0) set({ rejected, timestamp, isPromise }, cacheError)
        return rejected
      },
      resolve: v => Promise.resolve(on.success(v, true)),
      reject: v => Promise.reject(on.error(v, true))
    }
    try {
      const ret = rest[fname].apply(this, args)
      return isPromise(ret) ? ret.then(on.resolve, on.reject) : on.success(ret)
    } catch (rejected) { throw on.error(rejected) }
  }
}
