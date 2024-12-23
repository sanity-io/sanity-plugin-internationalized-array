import {LanguageDisplay} from '../types'

export function getLanguageDisplay(
  languageDisplay: LanguageDisplay,
  title: string,
  code: string
): string {
  if (languageDisplay === 'codeOnly') return code.toUpperCase()
  if (languageDisplay === 'titleOnly') return title
  if (languageDisplay === 'titleAndCode')
    return `${title} (${code.toUpperCase()})`
  return title
}
