import {SanityDocument} from 'sanity'

export function getNestedValue<T extends unknown>(
  path: (string | number)[],
  document: SanityDocument
): T | undefined {
  if (path.length > 1) {
    const nextPath = path[0]
    if (Array.isArray(document)) {
      return getNestedValue(path.slice(1), document[nextPath] as SanityDocument)
    }
    if (typeof document === 'object' && document.hasOwnProperty(nextPath)) {
      return getNestedValue(path.slice(1), document[nextPath] as SanityDocument)
    }
    return undefined
  }
  return document[path[0]] as T
}
