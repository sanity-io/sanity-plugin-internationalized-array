import {Box, Stack, Text, useToast} from '@sanity/ui'
import React, {useCallback} from 'react'
import {
  FormInsertPatch,
  FormSetIfMissingPatch,
  insert,
  isSanityDocument,
  PatchEvent,
  setIfMissing,
  useSchema,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {
  DocumentsToTranslate,
  getDocumentsToTranslate,
} from '../utils/getDocumentsToTranslate'
import AddButtons from './AddButtons'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type DocumentAddButtonsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any> | undefined
}
export default function DocumentAddButtons(
  props: DocumentAddButtonsProps
): React.ReactElement {
  const {filteredLanguages} = useInternationalizedArrayContext()
  const value = isSanityDocument(props.value) ? props.value : undefined

  const toast = useToast()
  const {onChange} = useDocumentPane()
  const schema = useSchema()

  const documentsToTranslation = getDocumentsToTranslate(value, [])

  // Helper function to determine if a field should be initialized as an array
  const getInitialValueForType = useCallback(
    (typeName: string): unknown => {
      if (!typeName) return undefined

      // Extract the base type name from internationalized array type
      // e.g., "internationalizedArrayBodyValue" -> "body"
      const match = typeName.match(/^internationalizedArray(.+)Value$/)
      if (!match) return undefined

      const baseTypeName = match[1].charAt(0).toLowerCase() + match[1].slice(1)

      // Check if it's a known array-based type (Portable Text fields)
      const arrayBasedTypes = [
        'body',
        'htmlContent',
        'blockContent',
        'portableText',
      ]
      if (arrayBasedTypes.includes(baseTypeName)) {
        return []
      }

      // Try to look up the schema type to determine if it's an array
      try {
        const schemaType = schema.get(typeName)
        if (schemaType) {
          // Check if this is an object type with a 'value' field
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const valueField = (schemaType as any)?.fields?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f: any) => f.name === 'value'
          )
          if (valueField) {
            const fieldType = valueField.type
            // Check if the value field is an array type
            if (
              fieldType?.jsonType === 'array' ||
              fieldType?.name === 'array' ||
              fieldType?.type === 'array' ||
              fieldType?.of !== undefined ||
              arrayBasedTypes.includes(fieldType?.name)
            ) {
              return []
            }
          }
        }
      } catch (error) {
        // If we can't determine from schema, fall back to undefined
        console.warn(
          'Could not determine field type from schema:',
          typeName,
          error
        )
      }

      return undefined
    },
    [schema]
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
      const alreadyTranslated = documentsToTranslation.filter(
        (translation) => translation?._key === languageId
      )
      const removeDuplicates = documentsToTranslation.reduce<
        DocumentsToTranslate[]
      >((filteredTranslations, translation) => {
        if (
          alreadyTranslated.filter(
            (alreadyTranslation) =>
              alreadyTranslation.pathString === translation.pathString
          ).length > 0
        ) {
          return filteredTranslations
        }
        const translationAlreadyExists = filteredTranslations.filter(
          (filteredTranslation) => filteredTranslation.path === translation.path
        )

        if (translationAlreadyExists.length > 0) {
          return filteredTranslations
        }
        return [...filteredTranslations, translation]
      }, [])
      if (removeDuplicates.length === 0) {
        toast.push({
          status: 'error',
          title: 'No internationalizedArray fields found in document root',
        })
        return
      }

      // Write a new patch for each empty field
      const patches: (FormSetIfMissingPatch | FormInsertPatch)[] = []

      for (const toTranslate of removeDuplicates) {
        const path = toTranslate.path

        // Get the appropriate initial value for this field type
        const initialValue = getInitialValueForType(toTranslate._type)

        const ifMissing = setIfMissing([], path)
        const insertValue = insert(
          [
            {
              _key: languageId,
              _type: toTranslate._type,
              value: initialValue, // Use the determined initial value instead of undefined
            },
          ],
          'after',
          [...path, -1]
        )
        patches.push(ifMissing)
        patches.push(insertValue)
      }

      onChange(PatchEvent.from(patches.flat()))
    },
    [documentsToTranslation, getInitialValueForType, onChange, toast]
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
