import {AddIcon, TranslateIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  defineDocumentFieldAction,
  DocumentFieldActionNode,
  DocumentFieldActionProps,
  KeyedObject,
  useFormValue,
} from 'sanity'

import {useInternationalizedArrayContext} from '../components/InternationalizedArrayContext'
import {Language} from '../types'

const createTranslateFieldActions: (
  fieldActionProps: DocumentFieldActionProps,
  context: {languages: Language[]; filteredLanguages: Language[]}
) => DocumentFieldActionNode[] = (
  fieldActionProps,
  {languages, filteredLanguages}
) =>
  languages.map((language) => {
    const onAction = useCallback(() => {
      console.log('ADD', fieldActionProps)
    }, [])
    const value = useFormValue(fieldActionProps.path) as KeyedObject[]

    return {
      type: 'action',
      icon: AddIcon,
      onAction,
      title: language.id.toLocaleUpperCase(),
      hidden: !filteredLanguages.some(
        (filtered) => filtered.id === language.id
      ),
      disabled: Array.isArray(value)
        ? value.some((item) => item._key === language.id)
        : true,
    }
  })

const addMissingTranslationsFieldAction: DocumentFieldActionNode = {
  type: 'action',
  icon: AddIcon,
  onAction: () => {
    console.log('ADD MISSING')
  },
  title: 'Add Missing',
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
            {type: 'divider'},
            addMissingTranslationsFieldAction,
          ]
        : [],
      hidden: !isInternationalizedArrayField,
    }
  },
})
