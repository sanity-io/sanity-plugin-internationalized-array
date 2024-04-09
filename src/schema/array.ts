/* eslint-disable no-nested-ternary */
import {defineField, type FieldDefinition, type Rule} from 'sanity'

import {peek} from '../cache'
import {createFieldName} from '../components/createFieldName'
import {getSelectedValue} from '../components/getSelectedValue'
import InternationalizedArray from '../components/InternationalizedArray'
import type {Language, LanguageCallback, Value} from '../types'
import {getLanguagesFieldOption} from '../utils/getLanguagesFieldOption'

type ArrayFactoryConfig = {
  apiVersion: string
  select?: Record<string, string>
  languages: Language[] | LanguageCallback
  defaultLanguages?: string[]
  type: string | FieldDefinition
}

export type ArrayFieldOptions = Pick<
  ArrayFactoryConfig,
  'apiVersion' | 'select' | 'languages'
>

export default (config: ArrayFactoryConfig): FieldDefinition<'array'> => {
  const {apiVersion, select, languages, type} = config
  const typeName = typeof type === `string` ? type : type.name
  const arrayName = createFieldName(typeName)
  const objectName = createFieldName(typeName, true)

  return defineField({
    name: arrayName,
    title: 'Internationalized array',
    type: 'array',
    components: {
      input: InternationalizedArray,
    },
    // These options are required for validation rules – not the custom input component
    options: {apiVersion, select, languages},
    of: [
      defineField({
        ...(typeof type === 'string' ? {} : type),
        name: objectName,
        type: objectName,
      }),
    ],
    validation: (rule: Rule) =>
      rule.custom<Value[]>(async (value, context) => {
        if (!value) {
          return true
        }

        const selectedValue = getSelectedValue(select, context.document)
        const client = context.getClient({apiVersion})

        let contextLanguages: Language[] = []
        const languagesFieldOption = getLanguagesFieldOption(context?.type)

        if (Array.isArray(languagesFieldOption)) {
          contextLanguages = languagesFieldOption
        } else if (Array.isArray(peek(selectedValue))) {
          contextLanguages = peek(selectedValue) || []
        } else if (typeof languagesFieldOption === 'function') {
          contextLanguages = await languagesFieldOption(client, selectedValue)
        }

        if (value && value.length > contextLanguages.length) {
          return `Cannot be more than ${
            contextLanguages.length === 1
              ? `1 item`
              : `${contextLanguages.length} items`
          }`
        }

        const nonLanguageKeys = value?.length
          ? value.filter(
              (item) =>
                !contextLanguages.find((language) => item._key === language.id)
            )
          : []
        if (nonLanguageKeys.length) {
          return {
            message: `Array item keys must be valid languages registered to the field type`,
            paths: nonLanguageKeys.map((item) => [{_key: item._key}]),
          }
        }

        // Ensure there's no duplicate `language` fields
        type KeyedValues = {
          [key: string]: Value[]
        }

        const valuesByLanguage = value?.length
          ? value
              .filter((item) => Boolean(item?._key))
              .reduce((acc, cur) => {
                if (acc[cur._key]) {
                  return {...acc, [cur._key]: [...acc[cur._key], cur]}
                }
                return {
                  ...acc,
                  [cur._key]: [cur],
                }
              }, {} as KeyedValues)
          : {}
        const duplicateValues = Object.values(valuesByLanguage)
          .filter((item) => item?.length > 1)
          .flat()
        if (duplicateValues.length) {
          return {
            message: 'There can only be one field per language',
            paths: duplicateValues.map((item) => [{_key: item._key}]),
          }
        }

        return true
      }),
  })
}
