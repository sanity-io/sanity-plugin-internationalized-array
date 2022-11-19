import {Rule, ArraySchemaType, RuleTypeConstraint} from 'sanity'

export type Language = {
  id: string
  title: string
}

export type AllowedType = 'string' | 'number' | 'boolean' | 'text' | 'reference'

export type ArrayConfig = {
  name: string
  type: AllowedType
  languages: Language[]
  title?: string
  group?: string
  hidden?: boolean | (() => boolean)
  readOnly?: boolean | (() => boolean)
  validation?: Rule | Rule[]
  field?: {[key: string]: any; options: {[key: string]: any}}
}

export type Value = {
  _key: string
  value?: string
}

export type PluginConfig = {
  languages: Language[]
  fieldTypes: (string | RuleTypeConstraint)[]
}

export type ArraySchemaWithLanguageOptions = ArraySchemaType & {
  options: {
    languages: Language[]
  }
}
