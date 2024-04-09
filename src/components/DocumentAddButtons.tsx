import {Box, Stack, Text, useToast} from '@sanity/ui'
import type React from 'react'
import {useCallback, useMemo} from 'react'
import {
  insert,
  isSanityDocument,
  type ObjectSchemaType,
  PatchEvent,
  setIfMissing,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {createValueSchemaTypeName} from '../utils/createValueSchemaTypeName'
import AddButtons from './AddButtons'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type DocumentAddButtonsProps = {
  schemaType: ObjectSchemaType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any> | undefined
}

export default function DocumentAddButtons(props: DocumentAddButtonsProps) {
  const {filteredLanguages} = useInternationalizedArrayContext()
  const {fields} = props.schemaType
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
      const patches = emptyLanguageFields
        .map((field) => {
          const fieldKey = field.name

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
        .flat()

      onChange(PatchEvent.from(patches))
    },
    [internationalizedArrayFields, onChange, toast, value]
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
