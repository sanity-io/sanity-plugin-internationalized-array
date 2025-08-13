/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import * as suspend from 'suspend-react'

import type {Language, LanguageCallback} from './types'

export const namespace = 'sanity-plugin-internationalized-array'

export const version = 'v1'

// Simple in-memory cache for validation functions that run outside React context
const validationCache = new Map<string, Language[]>()

// Cache for function references to enable sharing between same functions
const functionCache = new Map<string, Language[]>()

// Cache for function keys to avoid recalculating them
const functionKeyCache = new WeakMap<LanguageCallback, string>()

// https://github.com/pmndrs/suspend-react#preloading
export const preload = (fn: () => Promise<Language[]>) =>
  suspend.preload(() => fn(), [version, namespace])

// Enhanced preload function that can use custom cache keys
export const preloadWithKey = (
  fn: () => Promise<Language[]>,
  key: (string | number)[]
) => suspend.preload(() => fn(), key)

// https://github.com/pmndrs/suspend-react#cache-busting
export const clear = () => suspend.clear([version, namespace])

// https://github.com/pmndrs/suspend-react#peeking-into-entries-outside-of-suspense
export const peek = (selectedValue: Record<string, unknown>) =>
  suspend.peek([version, namespace, selectedValue]) as Language[] | undefined

// Helper function to create a stable cache key that matches the component's key structure
export const createCacheKey = (
  selectedValue: Record<string, unknown>,
  workspaceId?: string
) => {
  const selectedValueHash = JSON.stringify(selectedValue)
  return workspaceId
    ? [version, namespace, selectedValueHash, workspaceId]
    : [version, namespace, selectedValueHash]
}

// Enhanced peek function that can work with workspace context
export const peekWithWorkspace = (
  selectedValue: Record<string, unknown>,
  workspaceId?: string
) =>
  suspend.peek(createCacheKey(selectedValue, workspaceId)) as
    | Language[]
    | undefined

// Generate a unique key for a function reference (cached for performance)
export const getFunctionKey = (fn: LanguageCallback): string => {
  // Check if we already have a cached key for this function
  const cachedKey = functionKeyCache.get(fn)
  if (cachedKey) {
    return cachedKey
  }

  // Create a hash for functions (only when needed)
  const fnStr = fn.toString()
  let hash = 0
  // Only hash the first 100 characters for performance
  const maxLength = Math.min(fnStr.length, 100)
  for (let i = 0; i < maxLength; i++) {
    const char = fnStr.charCodeAt(i)
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char
    // eslint-disable-next-line no-bitwise
    hash &= hash // Convert to 32-bit integer
  }
  const key = `anonymous_${Math.abs(hash)}`
  functionKeyCache.set(fn, key)
  return key
}

// Create a cache key that includes function identity
export const createFunctionCacheKey = (
  fn: LanguageCallback,
  selectedValue: Record<string, unknown>,
  workspaceId?: string
): string => {
  const functionKey = getFunctionKey(fn)
  const selectedValueHash = JSON.stringify(selectedValue)
  return workspaceId
    ? `${functionKey}:${selectedValueHash}:${workspaceId}`
    : `${functionKey}:${selectedValueHash}`
}

// Cache for validation functions with function awareness
export const getValidationCache = (key: string): Language[] | undefined => {
  return validationCache.get(key)
}

export const setValidationCache = (
  key: string,
  languages: Language[]
): void => {
  validationCache.set(key, languages)
}

export const clearValidationCache = (): void => {
  validationCache.clear()
}

// Function-aware cache operations
export const getFunctionCache = (
  fn: LanguageCallback,
  selectedValue: Record<string, unknown>,
  workspaceId?: string
): Language[] | undefined => {
  const key = createFunctionCacheKey(fn, selectedValue, workspaceId)
  return functionCache.get(key)
}

export const setFunctionCache = (
  fn: LanguageCallback,
  selectedValue: Record<string, unknown>,
  languages: Language[],
  workspaceId?: string
): void => {
  const key = createFunctionCacheKey(fn, selectedValue, workspaceId)
  functionCache.set(key, languages)
}

export const clearFunctionCache = (): void => {
  functionCache.clear()
}

// Clear function key cache as well
export const clearAllCaches = (): void => {
  functionCache.clear()
  // Note: WeakMap doesn't have a clear method, but it will be garbage collected
  // when the function references are no longer held
}

// Check if two functions are the same reference
export const isSameFunction = (
  fn1: LanguageCallback,
  fn2: LanguageCallback
): boolean => {
  return fn1 === fn2 || getFunctionKey(fn1) === getFunctionKey(fn2)
}
