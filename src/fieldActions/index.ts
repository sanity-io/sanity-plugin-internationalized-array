import {AddIcon, TranslateIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  defineDocumentFieldAction,
  DocumentFieldActionItem,
  DocumentFieldActionProps,
  PatchEvent,
  setIfMissing,
  useFormValue,
} from 'sanity'
import {useDocumentPane} from 'sanity/desk'

import {
  InternationalizedArrayContextProps,
  useInternationalizedArrayContext,
} from '../components/InternationalizedArrayContext'
import {Value} from '../types'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'

const createTranslateFieldActions: (
  fieldActionProps: DocumentFieldActionProps,
  context: Pick<
    InternationalizedArrayContextProps,
    'languages' | 'filteredLanguages' | 'addLanguagePatchTransform'
  >
) => DocumentFieldActionItem[] = (
  fieldActionProps,
  {languages, filteredLanguages, addLanguagePatchTransform}
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

      const finalPatches = addLanguagePatchTransform
        ? patches.map((patch) => addLanguagePatchTransform(patch, value))
        : patches

      onChange(PatchEvent.from([setIfMissing([], path), ...finalPatches]))
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
  context: Pick<
    InternationalizedArrayContextProps,
    'languages' | 'filteredLanguages' | 'addLanguagePatchTransform'
  >
) => DocumentFieldActionItem = (
  fieldActionProps,
  {languages, filteredLanguages, addLanguagePatchTransform}
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

    const finalPatches = addLanguagePatchTransform
      ? patches.map((patch) => addLanguagePatchTransform(patch, value))
      : patches

    onChange(PatchEvent.from([setIfMissing([], path), ...finalPatches]))
  }, [
    fieldActionProps,
    filteredLanguages,
    languages,
    onChange,
    addLanguagePatchTransform,
    value,
  ])

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
    const {languages, filteredLanguages, addLanguagePatchTransform} =
      useInternationalizedArrayContext()

    const translateFieldActions = createTranslateFieldActions(
      fieldActionProps,
      {languages, filteredLanguages, addLanguagePatchTransform}
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
              addLanguagePatchTransform,
            }),
          ]
        : [],
      hidden: !isInternationalizedArrayField,
    }
  },
})
