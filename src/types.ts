import {Rule} from '@sanity/types'

export type ArrayConfig = Options & {
  name: string
  type: 'string' | 'number' | 'boolean' | 'text'
  title?: string
  group?: string
  hidden?: boolean | (() => boolean)
  readOnly?: boolean | (() => boolean)
  validation?: Rule | Rule[]
}

export type Value = {
  _key: string
  value?: string
}

export type Language = {
  id: string
  title: string
}

export type Options = {
  languages: Language[]
  showNativeInput: boolean
}
