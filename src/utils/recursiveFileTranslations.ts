import {Translator} from '../types'

interface TranslationParams {
  value: unknown
  targetLang: string
  translator: Translator
  excludeValues: string[]
  sourceLang?: string
}

export const getTranslations = async (
  params: TranslationParams
): Promise<unknown> => {
  const {value, targetLang, translator, excludeValues = [], sourceLang} = params
  if (!value) {
    return value
  }
  if (Array.isArray(value)) {
    const translationResult = await Promise.all(
      value.map(async (result) => {
        const translationResults = await getTranslations({
          ...params,
          value: result,
        })
        return translationResults
      })
    )
    return translationResult
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.includes('_type')) {
      const typedValue = value as {_type: string}
      const type = typedValue?._type
      if (type === 'slug') {
        return value
      }
      if (type === 'image') {
        return value
      }
    }
    let translatedObject = {} as Record<string, unknown>
    for (const key of keys) {
      const typeKey = key as keyof typeof value
      const startsWithUnderscoreRegex = /^_/

      const result = value[typeKey]
      if (
        !key.search(startsWithUnderscoreRegex) ||
        excludeValues.includes(key)
      ) {
        translatedObject = {...translatedObject, [key]: result}
        continue
      }

      translatedObject = {
        ...translatedObject,
        [key]: await getTranslations({...params, value: result}),
      }
    }

    return translatedObject
  }

  if (typeof value === 'string') {
    const translatedString = await translator({value, targetLang, sourceLang})
    return translatedString
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value
  }
  return value
}
