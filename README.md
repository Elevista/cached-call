# Cached call
Cache the function result by wrapping it  

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)  [![npm package](https://img.shields.io/npm/v/cached-call.svg?maxAge=2592000&style=flat-square)](https://www.npmjs.com/package/cached-call)

## Installation
```sh
npm i cached-call
```

## Basic Usage
```js
const CachedCall = require('cached-call')
const cache = new CachedCall()

cache({ someHeavyJob (v) { return v }, maxAge: 1000 })(v)
```

## Options
```js
const cache = new CachedCall()
cache({ [name]: func, maxAge, max, stale, key })(...args)
```
| name | description | default | example |
| - | - | - | - |
| `name` | Function name for cache key | (required) |  |
| `func` | Cache target function | (required) | 
| `key` | Key for create cache key (function or value) | `(...args) => args` | `1`, `'moo'` |
| `maxAge` | Maximum age in ms | (required) | `300`, `100` |
| `args` | Arguments that will be passed to `key` function | (required) |  |
| `max` | The maximum size of the cache | `Infinity` | `1000`, `100` |
| `stale` | return the stale value before deleting it | `false` | `true` |
| `cacheError` | Cache error and rejection for ms | `undefined` | `1000` |

## Auto generated internal cache key by default
```js
JSON.stringify([name, ...args])
```


## Examples
### Custom key function
#### Use only 3rd, 4th arguments for key
```js
const key = (nan, fn, n1, n2) => [n1, n2]
const pickArgs = cache({ someFunction, key, maxAge: 100 })
pickArgs(NaN, () => {}, 1, 2) // cache key : ["someFunction", 1 ,2]
```
### Clear cache at 10 or 20 minutes for every hour
```js
const dayjs = require('dayjs')
const everyHour = min => () => dayjs().add(60 - min, 'm').startOf('m').minute(min) - Date.now()
const every10minutes = cache({ someFunction, maxAge: everyHour(10) })
const every20minutes = cache({ someFunction, maxAge: everyHour(20) })
```
### Retry after 1s when error
```js
const retryThrottle = cache({ someFunction, maxAge: 30000, cacheError: 1000 })
retryThrottle()
```

## License
The MIT License (MIT)  
Copyright (c) 2020 Elevista
