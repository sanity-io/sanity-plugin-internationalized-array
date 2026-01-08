import {Language, Value} from '../types'

export function checkAllLanguagesArePresent(
  languages: Language[],
  value: Value[] | undefined
): boolean {
  const filteredLanguageIds = languages.map((l) => l.id)
  const languagesInUseIds = value ? value.map((v) => v.language) : []

  return (
    languagesInUseIds.length === filteredLanguageIds.length &&
    languagesInUseIds.every((l) => filteredLanguageIds.includes(l))
  )
}
