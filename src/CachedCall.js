const LRU = require('lru-cache')
const isFunction = fn => typeof fn === 'function'
const isPromise = v => (!!v) && (typeof v.then === 'function')
const noError = value => !(value.error || 'rejected' in value)

module.exports = function CachedCall () {
  const caches = {}
  return option => {
    if (isFunction(option)) option = { [option.name || 'fn']: option }
    const { maxAge, max, stale, key, cacheError, ...rest } = option
    const options = JSON.stringify({ maxAge, max, stale })
    const cache = caches[options] || (caches[options] = new LRU(JSON.parse(options)))
    const [fname] = Object.keys(rest)
    const get = {
      key: isFunction(key) ? key : (...args) => key || args,
      maxAge: function (value, ...args) {
        if (maxAge >= 0 || !isFunction(maxAge) || !noError(value)) return
        const { resolved, result } = value
        return maxAge.call(this, 'resolved' in value ? resolved : result, ...args)
      }
    }

    return function (...args) {
      const key = JSON.stringify([fname].concat(get.key.apply(this, args)))
      const cached = cache.get(key)

      if (cached) {
        const { promise, rejected, resolved, result, error, timestamp } = cached
        if (noError(cached)) {
          if (promise) return promise
          if ('result' in cached) return result
          return Promise.resolve(resolved)
        } else if (Date.now() < (timestamp + cacheError)) {
          if (promise) return promise
          if (error) throw error
          return Promise.reject(rejected)
        }
      }

      const set = async (value, age) => {
        const res = get.maxAge.call(this, value, ...args)
        const timestamp = Date.now()
        const { maxAge = age } = { maxAge: isPromise(res) ? await res : res }
        if (maxAge !== false) cache.set(key, { ...value, timestamp }, maxAge)
      }

      const promise = promise => promise.then(
        resolved => set({ resolved, promise }),
        rejected => set({ rejected, promise })
      ).then(() => promise)

      const sync = (result, error) => {
        error ? set({ error }) : set({ result })
        return error || result
      }

      try {
        const ret = rest[fname].apply(this, args)
        return isPromise(ret) ? promise(ret) : sync(ret)
      } catch (err) { throw sync(undefined, err) }
    }
  }
}
