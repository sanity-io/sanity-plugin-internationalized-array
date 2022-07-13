import {ArrayConfig, Value} from './types'
import LanguageArray from './LanguageArray'

export function internationalizedArray(config: ArrayConfig) {
  const {name = `title`, type = `string`, languages = [], showNativeInput = false} = config

  return {
    name,
    type: 'array',
    inputComponent: LanguageArray,
    options: {
      languages,
      showNativeInput,
    },
    of: [
      {
        type: 'object',
        fields: [{name: 'value', type}],
        preview: {
          select: {title: 'value', key: '_key'},
          prepare({title, key}) {
            return {
              title,
              subtitle: key.toUpperCase(),
            }
          },
        },
      },
    ],
    validation: (Rule) =>
      Rule.max(languages.length).custom((value: Value[], context) => {
        const {languages} = context.type.options

        const nonLanguageKeys = value?.length
          ? value.filter((item) => !languages.find((language) => item._key === language.id))
          : []

        if (nonLanguageKeys.length) {
          return {
            message: `Array item keys must be valid languages registered to the field type`,
            paths: nonLanguageKeys.map((item) => ({_key: item._key})),
          }
        }

        // Ensure there's no duplicate `language` fields
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
              }, {})
          : {}

        const duplicateValues = Object.values(valuesByLanguage)
          .filter((item) => item?.length > 1)
          .flat()

        if (duplicateValues.length) {
          return {
            message: 'There can only be one field per language',
            paths: duplicateValues.map((item) => ({_key: item._key})),
          }
        }

        return true
      }),
  }
}
