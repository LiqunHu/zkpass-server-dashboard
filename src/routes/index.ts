import admin from './admin'
import auth from './auth'
import system from './system'
import zkpass from './zkpass'
import test from './test'

export default [
  { url: '/api/auth', handler: auth },
  { url: '/api/admin', handler: admin },
  { url: '/api/system', handler: system },
  { url: '/api/zkpass', handler: zkpass },
  { url: '/api/test', handler: test }
]
