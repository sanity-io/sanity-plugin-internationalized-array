import {SanityDocument} from 'sanity'

export interface DocumentsToTranslate {
  path: (string | number)[]
  pathString: string
  _key: string
  _type: string
  [key: string]: unknown
}

export const getDocumentsToTranslate = (
  value: SanityDocument | unknown,
  rootPath: (string | number)[] = []
): DocumentsToTranslate[] => {
  if (Array.isArray(value)) {
    const arrayRootPath = [...rootPath]

    // if item contains internationalized return array
    const internationalizedValues = value.filter((item) => {
      if (Array.isArray(item)) return false

      if (typeof item === 'object') {
        const type = item?._type as string | undefined
        return (
          type?.startsWith('internationalizedArray') && type?.endsWith('Value')
        )
      }
      return false
    })

    if (internationalizedValues.length > 0) {
      return internationalizedValues.map((internationalizedValue) => {
        return {
          ...internationalizedValue,
          path: arrayRootPath,
          pathString: arrayRootPath.join('.'),
        }
      })
    }

    if (value.length > 0) {
      return value
        .map((item, index) =>
          getDocumentsToTranslate(item, [...arrayRootPath, index])
        )
        .flat()
    }

    return []
  }
  if (typeof value === 'object' && value) {
    const startsWithUnderscoreRegex = /^_/
    const itemKeys = Object.keys(value).filter(
      (key) => !key.match(startsWithUnderscoreRegex)
    ) as (keyof typeof value)[]

    return itemKeys
      .map((item) => {
        const selectedValue = value[item] as unknown
        const path = [...rootPath, item]
        return getDocumentsToTranslate(selectedValue, path)
      })
      .flat()
  }
  return []
}
