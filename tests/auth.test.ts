import assert from 'node:assert/strict'
import test from 'node:test'

import { getLoginRedirectPath, getSafeRedirectPath } from '../lib/auth/redirects.ts'
import { isProtectedPath } from '../lib/auth/routes.ts'

test('safe redirects accept internal paths and preserve query strings', () => {
  assert.equal(getSafeRedirectPath('/saved?filter=upcoming#list'), '/saved?filter=upcoming#list')
  assert.equal(getSafeRedirectPath('https://attacker.example/'), '/')
  assert.equal(getSafeRedirectPath('//attacker.example/'), '/')
  assert.equal(getSafeRedirectPath('not-a-path'), '/')
})

test('login redirects encode only a safe internal destination', () => {
  assert.equal(getLoginRedirectPath('/organizer/events/new'), '/login?next=%2Forganizer%2Fevents%2Fnew')
  assert.equal(getLoginRedirectPath('https://attacker.example'), '/login?next=%2F')
})

test('protected route policy covers saved and organizer paths only', () => {
  assert.equal(isProtectedPath('/saved'), true)
  assert.equal(isProtectedPath('/saved/archive'), true)
  assert.equal(isProtectedPath('/organizer/events/new'), true)
  assert.equal(isProtectedPath('/'), false)
  assert.equal(isProtectedPath('/discover'), false)
  assert.equal(isProtectedPath('/radar'), false)
  assert.equal(isProtectedPath('/events/example'), false)
})
