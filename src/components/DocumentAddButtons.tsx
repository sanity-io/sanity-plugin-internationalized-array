import {Box, Stack, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {
  insert,
  isSanityDocument,
  ObjectSchemaType,
  PatchEvent,
  setIfMissing,
} from 'sanity'
import {useDocumentPane} from 'sanity/desk'

import {createValueSchemaTypeName} from '../utils/createValueSchemaTypeName'
import {getTranslations} from '../utils/recursiveFileTranslations'
import {recursiveSchemaCreate} from '../utils/recursiveSchemaCreate'
import AddButtons from './AddButtons'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type DocumentAddButtonsProps = {
  schemaType: ObjectSchemaType
  value: Record<string, any> | undefined
}

export default function DocumentAddButtons(props: DocumentAddButtonsProps) {
  const {filteredLanguages, translator, excludeValues} =
    useInternationalizedArrayContext()
  const {fields} = props.schemaType
  console.log('test pa schemaType', props.schemaType)
  const testPaths = recursiveSchemaCreate(props.schemaType, [])
  console.log('test pa testPaths', testPaths)

  const value = isSanityDocument(props.value) ? props.value : undefined
  const toast = useToast()
  const {onChange} = useDocumentPane()

  // Find every internationalizedArray field at the document root
  // TODO: This should be a recursive search through nested fields
  const internationalizedArrayFields = useMemo(
    () =>
      fields.filter((field) =>
        field.type.name.startsWith('internationalizedArray')
      ),
    [fields]
  )

  console.log(
    'test pa internationalizedArrayFields',
    internationalizedArrayFields
  )

  const handleDocumentButtonClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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

      // Find every internationalizedArray field that is empty for the selected language
      const emptyLanguageFields = internationalizedArrayFields.filter(
        (field) => {
          const fieldValue = value?.[field.name]
          const fieldValueLanguage =
            fieldValue && Array.isArray(fieldValue)
              ? fieldValue.find((v) => v._key === languageId)
              : undefined

          return !fieldValueLanguage
        }
      )

      // Write a new patch for each empty field
      const patches = await Promise.all(
        emptyLanguageFields.map(async (field) => {
          const fieldKey = field.name

          if (translator) {
            const translations = await getTranslations({
              value,
              targetLang: languageId,
              translator,
              excludeValues,
              sourceLang: undefined,
            })
            console.log('test pa', translations)
            return [
              setIfMissing([], [fieldKey]),
              insert(
                [
                  {
                    _key: languageId,
                    _type: createValueSchemaTypeName(field.type),
                    // value: translations,
                  },
                ],
                'after',
                [fieldKey, -1]
              ),
            ]
          }
          return [
            setIfMissing([], [fieldKey]),
            insert(
              [
                {
                  _key: languageId,
                  _type: createValueSchemaTypeName(field.type),
                },
              ],
              'after',
              [fieldKey, -1]
            ),
          ]
        })
      )

      onChange(PatchEvent.from(patches.flat()))
    },
    [
      excludeValues,
      internationalizedArrayFields,
      onChange,
      toast,
      translator,
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
