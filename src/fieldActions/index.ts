import {AddIcon, TranslateIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  defineDocumentFieldAction,
  type DocumentFieldActionItem,
  type DocumentFieldActionProps,
  PatchEvent,
  setIfMissing,
  useFormValue,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useInternationalizedArrayContext} from '../components/InternationalizedArrayContext'
import type {Language, Value} from '../types'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'

const createTranslateFieldActions: (
  fieldActionProps: DocumentFieldActionProps,
  context: {
    languages: Language[]
    filteredLanguages: Language[]
  }
) => DocumentFieldActionItem[] = (
  fieldActionProps,
  {languages, filteredLanguages}
) =>
  languages.map((language) => {
    const value = useFormValue(fieldActionProps.path) as Value[]
    const disabled =
      value && Array.isArray(value)
        ? Boolean(value?.find((item) => item._key === language.id))
        : false
    const hidden = !filteredLanguages.some((f) => f.id === language.id)

    const {onChange} = useDocumentPane()

    const onAction = useCallback(() => {
      const {schemaType, path} = fieldActionProps

      const addLanguageKeys = [language.id]
      const patches = createAddLanguagePatches({
        addLanguageKeys,
        schemaType,
        languages,
        filteredLanguages,
        value,
        path,
      })

      onChange(PatchEvent.from([setIfMissing([], path), ...patches]))
    }, [language.id, value, onChange])

    return {
      type: 'action',
      icon: AddIcon,
      onAction,
      title: language.title,
      hidden,
      disabled,
    }
  })

const AddMissingTranslationsFieldAction: (
  fieldActionProps: DocumentFieldActionProps,
  context: {
    languages: Language[]
    filteredLanguages: Language[]
  }
) => DocumentFieldActionItem = (
  fieldActionProps,
  {languages, filteredLanguages}
) => {
  const value = useFormValue(fieldActionProps.path) as Value[]
  const disabled = value && value.length === filteredLanguages.length
  const hidden = checkAllLanguagesArePresent(filteredLanguages, value)

  const {onChange} = useDocumentPane()

  const onAction = useCallback(() => {
    const {schemaType, path} = fieldActionProps

    const addLanguageKeys: string[] = []
    const patches = createAddLanguagePatches({
      addLanguageKeys,
      schemaType,
      languages,
      filteredLanguages,
      value,
      path,
    })

    onChange(PatchEvent.from([setIfMissing([], path), ...patches]))
  }, [fieldActionProps, filteredLanguages, languages, onChange, value])

  return {
    type: 'action',
    icon: AddIcon,
    onAction,
    title: createAddAllTitle(value, filteredLanguages),
    disabled,
    hidden,
  }
}

export const internationalizedArrayFieldAction = defineDocumentFieldAction({
  name: 'internationalizedArray',
  useAction(fieldActionProps) {
    const isInternationalizedArrayField =
      fieldActionProps?.schemaType?.type?.name.startsWith(
        'internationalizedArray'
      )
    const {languages, filteredLanguages} = useInternationalizedArrayContext()

    const translateFieldActions = createTranslateFieldActions(
      fieldActionProps,
      {languages, filteredLanguages}
    )

    return {
      type: 'group',
      icon: TranslateIcon,
      title: 'Add Translation',
      renderAsButton: true,
      children: isInternationalizedArrayField
        ? [
            ...translateFieldActions,
            AddMissingTranslationsFieldAction(fieldActionProps, {
              languages,
              filteredLanguages,
            }),
          ]
        : [],
      hidden: !isInternationalizedArrayField,
    }
  },
})
