import type {
  ArraySchemaType,
  FieldDefinition,
  Rule,
  RuleTypeConstraint,
  SanityClient,
} from 'sanity'

export type Language = {
  id: Intl.UnicodeBCP47LocaleIdentifier
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

export type LanguageCallback = (
  client: SanityClient,
  selectedValue: Record<string, unknown>
) => Promise<Language[]>

export type PluginConfig = {
  /**
   * https://www.sanity.io/docs/api-versioning
   * @defaultValue '2022-11-27'
   */
  apiVersion?: string
  /**
   * Specify fields that should be available in the language callback:
   * ```tsx
   * {
   *   select: {
   *     markets: 'markets'
   *   },
   *   languages: (client, {markets}) =>
   *     query.fetch(groq`*[_type == "language" && market in $markets]{id,title}`, {markets})
   * }
   * ```
   */
  select?: Record<string, string>
  /**
   * You can give it an array of language definitions:
   * ```tsx
   * {
   *   languages: [
   *     {id: 'en', title: 'English'},
   *     {id: 'fr', title: 'French'}
   *   ]
   * }
   * ```
   * You can load them async by passing a function that returns a promise:
   * ```tsx
   * {
   *   languages: async () => {
   *     const response = await fetch('https://example.com/languages')
   *     return response.json()
   *   }
   * }
   * ```
   * You can query your dataset for languages::
   * ```tsx
   * {
   *   languages: (client) =>
   *     query.fetch(groq`*[_type == "language"]{id,title}`)
   * }
   * ```
   */
  languages: Language[] | LanguageCallback
  /**
   * Can be a string matching core field types, as well as custom ones:
   * ```tsx
   * {
   *   fieldTypes: [
   *     "date", "datetime", "file", "image", "number", "string", "text", "url"
   *   ]
   * }
   * ```
   * You can also define a type directly:
   * ```tsx
   * {
   *   fieldTypes: [
   *     defineField({
   *       name: 'featuredProduct',
   *       type: 'reference',
   *       to: [{type: 'product'}]
   *       hidden: (({document}) => !document?.title)
   *     })
   *   ]
   * }
   * ```
   */
  fieldTypes: (string | RuleTypeConstraint | FieldDefinition)[]
}

export type ArraySchemaWithLanguageOptions = ArraySchemaType & {
  options: {
    select?: Record<string, string>
    languages: Language[] | LanguageCallback
    apiVersion: string
  }
}
