import {AddIcon} from '@sanity/icons'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Button, Grid, Stack, useToast} from '@sanity/ui'
import equal from 'fast-deep-equal'
import React, {useCallback, useDeferredValue, useEffect, useMemo} from 'react'
import {
  ArrayOfObjectsInputProps,
  ArrayOfObjectsItem,
  insert,
  set,
  setIfMissing,
  useClient,
  useFormBuilder,
  useFormValue,
} from 'sanity'
import {suspend} from 'suspend-react'

import {namespace, version} from '../cache'
import {MAX_COLUMNS} from '../constants'
import type {ArraySchemaWithLanguageOptions, Value} from '../types'
import Feedback from './Feedback'
import {getSelectedValue} from './getSelectedValue'
// TODO: Move this provider to the root component
import {LanguageProvider} from './languageContext'

export type InternationalizedArrayProps = ArrayOfObjectsInputProps<
  Value,
  ArraySchemaWithLanguageOptions
>

export default function InternationalizedArray(
  props: InternationalizedArrayProps
) {
  const {members, value, schemaType, onChange} = props

  const readOnly =
    typeof schemaType.readOnly === 'boolean' ? schemaType.readOnly : false
  const {options} = schemaType
  const toast = useToast()
  const {value: document} = useFormBuilder()
  const deferredDocument = useDeferredValue(document)
  const selectedValue = useMemo(
    () => getSelectedValue(options.select, deferredDocument),
    [options.select, deferredDocument]
  )

  const {apiVersion, defaultLanguages} = options
  const client = useClient({apiVersion})
  const languages = Array.isArray(options.languages)
    ? options.languages
    : suspend(
        // eslint-disable-next-line require-await
        async () => {
          if (typeof options.languages === 'function') {
            return options.languages(client, selectedValue)
          }
          return options.languages
        },
        [version, namespace, selectedValue],
        {equal}
      )

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

  const filteredLanguages = useMemo(
    () =>
      languageFilterEnabled
        ? languages.filter((language) =>
            selectedLanguageIds.includes(language.id)
          )
        : languages,
    [languageFilterEnabled, languages, selectedLanguageIds]
  )

  const handleAddLanguage = useCallback(
    (param?: React.MouseEvent<HTMLButtonElement, MouseEvent> | string[]) => {
      if (!filteredLanguages?.length) {
        return
      }

      const languageIds: string[] = Array.isArray(param)
        ? param
        : ([param?.currentTarget?.value].filter(Boolean) as string[])
      const itemBase = {_type: `${schemaType.name}Value`}

      // Create new items
      const newItems =
        Array.isArray(languageIds) && languageIds.length > 0
          ? // Just one for this language
            languageIds.map((id) => ({...itemBase, _key: id}))
          : // Or one for every missing language
            filteredLanguages
              .filter((language) =>
                value?.length
                  ? !value.find((v) => v._key === language.id)
                  : true
              )
              .map((language) => ({...itemBase, _key: language.id}))

      // Insert new items in the correct order
      const languagesInUse = value?.length ? value.map((v) => v) : []

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
            insert([item], 'after', [nextLanguageIndex])
          : // Next language found, insert before that
            insert([item], 'before', [nextLanguageIndex])
      })

      onChange([setIfMissing([]), ...insertions])
    },
    [filteredLanguages, onChange, schemaType.name, value]
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
  const allLanguagesArePresent = useMemo(() => {
    const filteredLanguageIds = filteredLanguages.map((l) => l.id)
    const languagesInUseIds = value ? value.map((v) => v._key) : []

    return (
      languagesInUseIds.length === filteredLanguageIds.length &&
      languagesInUseIds.every((l) => filteredLanguageIds.includes(l))
    )
  }, [filteredLanguages, value])

  if (!languagesAreValid) {
    return <Feedback />
  }

  return (
    <LanguageProvider value={{languages: filteredLanguages}}>
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

        {/* Show buttons if languages are configured */}
        {/* Hide them if all languages have values */}
        {filteredLanguages?.length > 0 && !allLanguagesArePresent ? (
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
                      filteredLanguages.length > MAX_COLUMNS
                        ? undefined
                        : AddIcon
                    }
                    value={language.id}
                    onClick={handleAddLanguage}
                  />
                ))}
              </Grid>
            ) : null}
            <Button
              tone="primary"
              mode="ghost"
              disabled={readOnly || allLanguagesArePresent}
              icon={AddIcon}
              text={
                // eslint-disable-next-line no-nested-ternary
                value?.length
                  ? `Add missing ${
                      filteredLanguages.length - value.length === 1
                        ? `language`
                        : `languages`
                    }`
                  : filteredLanguages.length === 1
                  ? `Add ${filteredLanguages[0].title} Field`
                  : `Add all languages`
              }
              onClick={handleAddLanguage}
            />
          </Stack>
        ) : null}
      </Stack>
    </LanguageProvider>
  )
}
