import system from './system'
import auth from './auth'
import common from './common'
import zkpass from './zkpass'
import test from './test'

export default [
  { url: '/api/auth', handler: auth },
  { url: '/api/system', handler: system },
  { url: '/api/common', handler: common },
  { url: '/api/zkpass', handler: zkpass },
  { url: '/api/test', handler: test }
]
