import {Box, Stack, Text, useToast} from '@sanity/ui'
import React, {useCallback} from 'react'
import {
  FormInsertPatch,
  FormSetIfMissingPatch,
  insert,
  isSanityDocument,
  ObjectSchemaType,
  PatchEvent,
  setIfMissing,
} from 'sanity'
import {useDocumentPane} from 'sanity/desk'

import {Translator} from '../types'
import {createValueSchemaTypeName} from '../utils/createValueSchemaTypeName'
import {getNestedValue} from '../utils/getNestedDocument'
import {getTranslations} from '../utils/recursiveFileTranslations'
import {createInternationalizedArrayFields} from '../utils/recursiveSchemaCreate'
import AddButtons from './AddButtons'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'
type DocumentAddButtonsProps = {
  schemaType: ObjectSchemaType
  value: Record<string, any> | undefined
  translator: Translator | undefined
  excludeValues?: string[]
}
export default function DocumentAddButtons(props: DocumentAddButtonsProps) {
  const {filteredLanguages} = useInternationalizedArrayContext()
  const value = isSanityDocument(props.value) ? props.value : undefined

  const toast = useToast()
  const {onChange} = useDocumentPane()

  const internationalizedArrayFields = createInternationalizedArrayFields(
    props.schemaType,
    []
  )
  console.log('test', {internationalizedArrayFields, schema: props.schemaType})
  const handleDocumentButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const languageId = event.currentTarget.value
      if (!languageId) {
        toast.push({
          status: 'error',
          title: 'No language selected',
        })
        return
      }
      if (internationalizedArrayFields.length === 0) {
        toast.push({
          status: 'error',
          title: 'No internationalizedArray fields found in document root',
        })
        return
      }

      // Write a new patch for each empty field
      const patches: (FormSetIfMissingPatch | FormInsertPatch)[] =
        internationalizedArrayFields.reduce<
          (FormSetIfMissingPatch | FormInsertPatch)[]
        >((acc, field) => {
          const path = field.path
          if (!field.type) return acc ?? []
          console.log('test pa', {path})

          const currentTranslations = value
            ? getNestedValue<
                {
                  _key: string
                  _type: string
                  value: unknown
                }[]
              >(path, value)
            : []

          if (!Array.isArray(currentTranslations)) {
            return acc
          }
          console.log('test pa', {currentTranslations, path})

          const translationsAlreadyExists = currentTranslations.find(
            (translation) => translation._key === languageId
          )

          if (translationsAlreadyExists && translationsAlreadyExists.value) {
            return acc
          }
          const translationSource = currentTranslations.find(
            (translation) => translation._key !== languageId
          )
          const sourceLang = translationSource?._key
          const translations =
            props.translator && translationSource?.value
              ? getTranslations({
                  value: translationSource?.value,
                  targetLang: languageId,
                  translator: props.translator,
                  excludeValues: props.excludeValues ?? [],
                  sourceLang,
                })
              : undefined

          return [
            ...acc,
            setIfMissing([], path),
            insert(
              [
                {
                  _key: languageId,
                  _type: createValueSchemaTypeName(field.type),
                  value: translations,
                },
              ],
              'after',
              [...path, -1]
            ),
          ]
        }, [])
      console.log('test pa', patches)
      onChange(PatchEvent.from(patches.flat()))
    },
    [
      internationalizedArrayFields,
      onChange,
      props.excludeValues,
      props.translator,
      toast,
      value,
    ]
  )
  return (
    <Stack space={3}>
      <Box>
        <Text size={1} weight="semibold">
          Add translation to internationalized fields
        </Text>
      </Box>
      <AddButtons
        languages={filteredLanguages}
        readOnly={false}
        value={undefined}
        onClick={handleDocumentButtonClick}
      />
    </Stack>
  )
}
