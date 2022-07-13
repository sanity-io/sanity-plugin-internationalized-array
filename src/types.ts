export type ArrayConfig = Options & {
  name: string
  type: 'string' | 'number' | 'boolean' | 'text'
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
