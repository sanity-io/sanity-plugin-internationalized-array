import {Box, Stack, Text, useToast} from '@sanity/ui'
import React, {useCallback} from 'react'
import {
  FormInsertPatch,
  FormSetIfMissingPatch,
  insert,
  isSanityDocument,
  PatchEvent,
  setIfMissing,
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
export default function DocumentAddButtons(props: DocumentAddButtonsProps) {
  const {filteredLanguages} = useInternationalizedArrayContext()
  const value = isSanityDocument(props.value) ? props.value : undefined

  const toast = useToast()
  const {onChange} = useDocumentPane()

  const documentsToTranslation = getDocumentsToTranslate(value, [])

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

        const ifMissing = setIfMissing([], path)
        const insertValue = insert(
          [
            {
              _key: languageId,
              _type: toTranslate._type,
              value: undefined,
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
    [documentsToTranslation, onChange, toast]
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
