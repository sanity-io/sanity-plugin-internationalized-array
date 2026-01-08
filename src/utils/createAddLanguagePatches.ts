import {FormInsertPatch, insert, Path, SchemaType} from 'sanity'

import {Language, Value} from '../types'
import {createValueSchemaTypeName} from './createValueSchemaTypeName'

type AddConfig = {
  // New keys to add to the field
  addLanguageKeys: string[]
  // Schema of the current field
  schemaType: SchemaType
  // All languages registered in the plugin
  languages: Language[]
  // Languages that are currently visible
  filteredLanguages: Language[]
  // Current value of the internationalizedArray field
  value?: Value[]
  // Path to this item
  path?: Path
}

export function createAddLanguagePatches(config: AddConfig): FormInsertPatch[] {
  const {
    addLanguageKeys,
    schemaType,
    languages,
    filteredLanguages,
    value,
    path = [],
  } = config

  const itemBase = {_type: createValueSchemaTypeName(schemaType)}

  // Create new items
  const getNewItems = () => {
    if (Array.isArray(addLanguageKeys) && addLanguageKeys.length > 0) {
      return addLanguageKeys.map((id) => ({
        ...itemBase,
        _key: id,
      }))
    }

    return filteredLanguages
      .filter((language) =>
        value?.length ? !value.find((v) => v._key === language.id) : true
      )
      .map((language) => ({
        ...itemBase,
        _key: language.id,
      }))
  }
  const newItems = getNewItems()

  // Insert new items in the correct order
  const languagesInUse = value?.length ? value.map((v) => v) : []

  const insertions = newItems.map((item) => {
    // What's the original index of this language?
    const languageIndex = languages.findIndex((l) => item._key === l.id)

    // What languages are there beyond that index?
    const remainingLanguages = languages.slice(languageIndex + 1)

    // So what is the index in the current value array of the next language in the language array?
    const nextLanguageIndex = languagesInUse.findIndex((l) =>
      // eslint-disable-next-line max-nested-callbacks
      remainingLanguages.find((r) => r.id === l._key)
    )

    // Keep local state up to date incase multiple insertions are being made
    if (nextLanguageIndex < 0) {
      languagesInUse.push(item)
    } else {
      languagesInUse.splice(nextLanguageIndex, 0, item)
    }

    return nextLanguageIndex < 0
      ? // No next language (-1), add to end of array
        insert([item], 'after', [...path, nextLanguageIndex])
      : // Next language found, insert before that
        insert([item], 'before', [...path, nextLanguageIndex])
  })

  return insertions
}
