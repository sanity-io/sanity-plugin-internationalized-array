/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import * as suspend from 'suspend-react'
import type {Language} from './types'

export const namespace = 'sanity-plugin-internationalized-array'

export const version = 'v0'

// https://github.com/pmndrs/suspend-react#preloading
export const preload = (fn: () => Promise<Language[]>) =>
  suspend.preload(() => fn(), [version, namespace])

// https://github.com/pmndrs/suspend-react#cache-busting
export const clear = () => suspend.clear([version, namespace])

// https://github.com/pmndrs/suspend-react#peeking-into-entries-outside-of-suspense
export const peek = (selectedValue: Record<string, unknown>) =>
  suspend.peek([version, namespace, selectedValue]) as Language[] | undefined
