import {Language, Value} from '../types'

export function createAddAllTitle(
  value: Value[] | undefined,
  languages: Language[]
): string {
  if (value?.length) {
    return `Add missing ${
      languages.length - value.length === 1 ? `language` : `languages`
    }`
  }

  return languages.length === 1
    ? `Add ${languages[0].title} Field`
    : `Add all languages`
}
