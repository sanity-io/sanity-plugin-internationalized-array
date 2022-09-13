import {defineField, Rule, Schema} from 'sanity'

import {createFieldName} from '../components/createFieldName'
import InternationalizedArrayInput from '../components/InternationalizedArrayInput'
import {Language, Value} from '../types'

type ArrayFactoryConfig = {
  languages: Language[]
  type: string | Schema.FieldDefinition
}

export default (config: ArrayFactoryConfig): Schema.FieldDefinition<'array'> => {
  const {languages, type} = config
  const typeName = typeof type === `string` ? type : type.name
  const arrayName = createFieldName(typeName)
  const objectName = createFieldName(typeName, true)

  return defineField({
    name: arrayName,
    title: 'Internationalized array',
    type: 'array',
    components: {input: InternationalizedArrayInput},
    options: {languages},
    of: [defineField({name: objectName, type: objectName})],
    validation: (rule: Rule) =>
      rule.max(languages?.length).custom<Value[]>((value, context) => {
        const {languages: contextLanguages}: {languages: Language[]} = context?.type?.options ?? {}
        const nonLanguageKeys = value?.length
          ? value.filter((item) => !contextLanguages.find((language) => item._key === language.id))
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
