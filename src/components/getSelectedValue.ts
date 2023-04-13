import {get} from 'lodash'

export const getSelectedValue = (
  select: Record<string, string> | undefined,
  document:
    | {
        [x: string]: unknown
      }
    | undefined
): Record<string, unknown> => {
  if (!select || !document) {
    return {}
  }

  const selection: Record<string, string> = select || {}
  const selectedValue: Record<string, unknown> = {}
  for (const [key, path] of Object.entries(selection)) {
    let value = get(document, path)
    if (Array.isArray(value)) {
      // If there are references in the array, ensure they have `_ref` set, otherwise they are considered empty and can safely be ignored
      value = value.filter((item) =>
        typeof item === 'object'
          ? item?._type === 'reference' && '_ref' in item
          : true
      )
    }
    selectedValue[key] = value
  }

  return selectedValue
}
