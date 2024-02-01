import {FormInsertPatch, insert, Path, SchemaType} from 'sanity'

import {Language, Value} from '../types'
import {createValueSchemaTypeName} from './createValueSchemaTypeName'
import {getTranslations} from './recursiveFileTranslations'

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

interface Schema {
  name: string
  type: 'array' | 'object' | 'string' | 'number' | 'boolean'
  children?: Schema[]
}
const createSchema = (schemaType: SchemaType): Schema => {
  if (schemaType.jsonType === 'array') {
    const ofArraySchemas = schemaType.of
    const arraySchemaResults = ofArraySchemas.map((ofArraySchema) => {
      const fieldName = ofArraySchema.name
      const arraySchema = createSchema(ofArraySchema)
      return {
        name: fieldName,
        type: arraySchema.type,
        children: arraySchema.children,
      }
    })
    return {
      name: schemaType.name,
      type: schemaType.jsonType,
      children: arraySchemaResults,
    }
  }
  if (schemaType.jsonType === 'object') {
    const objectSchemaFields = schemaType.fields
    const objectSchemaResults = objectSchemaFields.map((objectField) => {
      const objectSchemaField = objectField.type
      const fieldName = objectField.name
      const objectSchema = createSchema(objectSchemaField)
      return {
        name: fieldName,
        type: objectSchema.type,
        children: objectSchema.children,
      }
    })
    return {
      name: schemaType.name,
      type: schemaType.jsonType,
      children: objectSchemaResults,
    }
  }
  return {
    type: schemaType.jsonType,
    name: schemaType.name,
  }
}

const translateString = async (
  text: string,
  targetLang: string,
  sourceLang?: string
) => {
  const regex = /[_-]/

  if (!text.search(regex)) {
    return text
  }
  try {
    console.log('test pa log', {
      text,
      targetLang,
      sourceLang,
    })
    return text
  } catch (error) {
    return text
  }
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
  console.log('test patch', config)

  const itemBase = {_type: createValueSchemaTypeName(schemaType)}
  console.log('test patch itemBase', itemBase)

  const hasValue = (value?.length ?? 0) > 0 && Boolean(value?.at(0)?.value)

  const itemValue = hasValue ? value?.at(0)?.value : undefined
  const itemValueSourceLanguage = hasValue ? value?.at(0)?._key : undefined
  // TODO create translations for value from add language keys

  // Create new items
  const newItems =
    Array.isArray(addLanguageKeys) && addLanguageKeys.length > 0
      ? // Just one for this language
        addLanguageKeys.map((id) => ({
          ...itemBase,
          _key: id,
          value: getTranslations({
            value: itemValue,
            target: id,
            translator: translateString,
            excludeValues: [],
            sourceLang: itemValueSourceLanguage,
          }),
        }))
      : // Or one for every missing language
        filteredLanguages
          .filter((language) =>
            value?.length ? !value.find((v) => v._key === language.id) : true
          )
          .map((language) => ({
            ...itemBase,
            _key: language.id,
            value: getTranslations({
              value: itemValue,
              target: language.id,
              translator: translateString,
              excludeValues: [],
              sourceLang: itemValueSourceLanguage,
            }),
          }))

  console.log('test patch newItems', newItems)

  // Insert new items in the correct order
  const languagesInUse = value?.length ? value.map((v) => v) : []

  console.log('test patch languagesInUse', languagesInUse)

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

  console.log('test patch insertions', insertions)

  return insertions
}
