export type Translator = (
  text: string,
  targetLang: string,
  sourceLang?: string
) => Promise<string>

interface TranslationParams {
  value: unknown
  target: string
  translator: Translator
  excludeValues: string[]
  sourceLang?: string
}

export const getTranslations = async ({
  value,
  target,
  translator,
  excludeValues = [],
  sourceLang,
}: TranslationParams): Promise<unknown> => {
  if (!value) {
    return value
  }
  if (Array.isArray(value)) {
    const translationResult = await Promise.all(
      value.map(async (result) => {
        const translationResults = await getTranslations({
          value: result,
          target,
          translator,
          excludeValues,
          sourceLang,
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
        excludeValues.includes(key) ||
        key === 'migration' ||
        key === 'icon' ||
        key === 'program_variation' ||
        key === 'program_status' ||
        key === 'matching_algorithm' ||
        key === 'text_area_size' ||
        key === 'metadata' ||
        key === 'media' ||
        key === 'url' ||
        key === 'color_palette_config' ||
        key === 'basic_info' ||
        key === 'migration'
      ) {
        translatedObject = {...translatedObject, [key]: result}
        continue
      }

      translatedObject = {
        ...translatedObject,
        [key]: await getTranslations({
          value: result,
          target,
          translator,
          excludeValues,
          sourceLang,
        }),
      }
    }

    return translatedObject
  }

  if (typeof value === 'string') {
    const translatedString = await translator(value, target, sourceLang)
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
