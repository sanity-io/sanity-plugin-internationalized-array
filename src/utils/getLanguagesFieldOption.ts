import {SchemaType} from 'sanity'

import {ArrayFieldOptions} from '../schema/array'

export function getLanguagesFieldOption(
  schemaType: SchemaType | undefined
): ArrayFieldOptions['languages'] | undefined {
  if (!schemaType) {
    return undefined
  }
  const languagesOption = (schemaType.options as ArrayFieldOptions)?.languages
  if (languagesOption) {
    return languagesOption
  }
  return getLanguagesFieldOption(schemaType.type)
}
