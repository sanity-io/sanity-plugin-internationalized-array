import {Language, Value} from '../types'

export function checkAllLanguagesArePresent(
  languages: Language[],
  value: Value[] | undefined
): boolean {
  const filteredLanguageIds = languages.map((l) => l.id)
  const languagesInUseIds = value ? value.map((v) => v._key) : []

  return (
    languagesInUseIds.length === filteredLanguageIds.length &&
    languagesInUseIds.every((l) => filteredLanguageIds.includes(l))
  )
}
