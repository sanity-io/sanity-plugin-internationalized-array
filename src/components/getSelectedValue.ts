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
  const targetKeys = Object.keys(selection)
  const selectedValue = targetKeys.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = get(document, selection[key])

    return acc
  }, {})

  return selectedValue
}
