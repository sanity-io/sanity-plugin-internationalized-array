import {AddIcon} from '@sanity/icons'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Button, Grid, Stack, useToast} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo} from 'react'
import {
  ArrayOfObjectsInputProps,
  ArrayOfObjectsItem,
  ArraySchemaType,
  set,
  setIfMissing,
  useFormValue,
} from 'sanity'

import {MAX_COLUMNS} from '../constants'
import type {Value} from '../types'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'
import Feedback from './Feedback'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

export type InternationalizedArrayProps = ArrayOfObjectsInputProps<
  Value,
  ArraySchemaType
>

export default function InternationalizedArray(
  props: InternationalizedArrayProps
) {
  const {members, value, schemaType, onChange} = props

  const readOnly =
    typeof schemaType.readOnly === 'boolean' ? schemaType.readOnly : false
  const toast = useToast()

  const {
    languages,
    filteredLanguages,
    defaultLanguages,
    buttonAddAll,
    buttonLocations,
  } = useInternationalizedArrayContext()

  // Support updating the UI if languageFilter is installed
  const {selectedLanguageIds, options: languageFilterOptions} =
    useLanguageFilterStudioContext()
  const documentType = useFormValue(['_type'])
  const languageFilterEnabled =
    typeof documentType === 'string' &&
    languageFilterOptions.documentTypes.includes(documentType)

  const filteredMembers = useMemo(
    () =>
      languageFilterEnabled
        ? members.filter((member) => {
            // This member is the outer object created by the plugin
            // Satisfy TS
            if (member.kind !== 'item') {
              return false
            }

            // This is the inner "value" field member created by this plugin
            const valueMember = member.item.members[0]

            // Satisfy TS
            if (valueMember.kind !== 'field') {
              return false
            }

            return languageFilterOptions.filterField(
              member.item.schemaType,
              valueMember,
              selectedLanguageIds
            )
          })
        : members,
    [languageFilterEnabled, members, languageFilterOptions, selectedLanguageIds]
  )

  const handleAddLanguage = useCallback(
    (param?: React.MouseEvent<HTMLButtonElement, MouseEvent> | string[]) => {
      if (!filteredLanguages?.length) {
        return
      }

      const addLanguageKeys: string[] = Array.isArray(param)
        ? param
        : ([param?.currentTarget?.value].filter(Boolean) as string[])

      const patches = createAddLanguagePatches({
        addLanguageKeys,
        schemaType,
        languages,
        filteredLanguages,
        value,
      })

      onChange([setIfMissing([]), ...patches])
    },
    [filteredLanguages, languages, onChange, schemaType, value]
  )

  // Create default fields if the document is not yet created
  const documentCreatedAt = useFormValue(['_createdAt'])

  if (
    // Array field is empty
    !value &&
    // Document form is in "not yet created" state
    !documentCreatedAt &&
    // Plugin config included default languages
    defaultLanguages &&
    defaultLanguages?.length > 0
  ) {
    handleAddLanguage(defaultLanguages)
  }

  // TODO: This is reordering and re-setting the whole array, it could be surgical
  const handleRestoreOrder = useCallback(() => {
    if (!value?.length || !languages?.length) {
      return
    }

    // Create a new value array in the correct order
    // This would also strip out values that don't have a language as the key
    const updatedValue = value
      .reduce((acc, v) => {
        const newIndex = languages.findIndex((l) => l.id === v?._key)

        if (newIndex > -1) {
          acc[newIndex] = v
        }

        return acc
      }, [] as Value[])
      .filter(Boolean)

    if (value?.length !== updatedValue.length) {
      toast.push({
        title: 'There was an error reordering languages',
        status: 'warning',
      })
    }

    onChange(set(updatedValue))
  }, [toast, languages, onChange, value])

  const allKeysAreLanguages = useMemo(() => {
    if (!value?.length || !languages?.length) {
      return true
    }

    return value?.every((v) => languages.find((l) => l?.id === v?._key))
  }, [value, languages])

  // Check languages are in the correct order
  const languagesInUse = useMemo(
    () =>
      languages && languages.length > 1
        ? languages.filter((l) => value?.find((v) => v._key === l.id))
        : [],
    [languages, value]
  )

  const languagesOutOfOrder = useMemo(() => {
    if (!value?.length || !languagesInUse.length) {
      return []
    }

    return value
      .map((v, vIndex) =>
        vIndex === languagesInUse.findIndex((l) => l.id === v._key) ? null : v
      )
      .filter(Boolean)
  }, [value, languagesInUse])

  const languagesAreValid = useMemo(
    () =>
      !languages?.length ||
      (languages?.length && languages.every((item) => item.id && item.title)),
    [languages]
  )

  // Automatically restore order of fields
  useEffect(() => {
    if (languagesOutOfOrder.length > 0 && allKeysAreLanguages) {
      handleRestoreOrder()
    }
  }, [languagesOutOfOrder, allKeysAreLanguages, handleRestoreOrder])

  // compare value keys with possible languages
  const allLanguagesArePresent = useMemo(
    () => checkAllLanguagesArePresent(filteredLanguages, value),
    [filteredLanguages, value]
  )

  if (!languagesAreValid) {
    return <Feedback />
  }

  const addButtonsAreVisible =
    // Plugin was configured to display buttons here (default!)
    buttonLocations.includes('field') &&
    // There's at least one language visible
    filteredLanguages?.length > 0 &&
    // Not every language has a value yet
    !allLanguagesArePresent

  return (
    <Stack space={2}>
      {members?.length > 0 ? (
        <>
          {filteredMembers.map((member) => {
            if (member.kind === 'item') {
              return (
                <ArrayOfObjectsItem
                  key={member.key}
                  member={member}
                  renderItem={props.renderItem}
                  renderField={props.renderField}
                  renderInput={props.renderInput}
                  renderPreview={props.renderPreview}
                />
              )
            }

            return null
          })}
        </>
      ) : null}

      {addButtonsAreVisible ? (
        <Stack space={2}>
          {/* Hide language-specific buttons if there's only one */}
          {/* No more than 7 columns */}
          {filteredLanguages.length > 1 ? (
            <Grid
              columns={Math.min(filteredLanguages.length, MAX_COLUMNS)}
              gap={2}
            >
              {filteredLanguages.map((language) => (
                <Button
                  key={language.id}
                  tone="primary"
                  mode="ghost"
                  fontSize={1}
                  disabled={
                    readOnly ||
                    Boolean(value?.find((item) => item._key === language.id))
                  }
                  text={language.id.toUpperCase()}
                  // Only show plus icon if there's one row or less
                  icon={
                    filteredLanguages.length > MAX_COLUMNS ? undefined : AddIcon
                  }
                  value={language.id}
                  onClick={handleAddLanguage}
                />
              ))}
            </Grid>
          ) : null}
          {buttonAddAll ? (
            <Button
              tone="primary"
              mode="ghost"
              disabled={readOnly || allLanguagesArePresent}
              icon={AddIcon}
              text={createAddAllTitle(value, filteredLanguages)}
              onClick={handleAddLanguage}
            />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  )
}
