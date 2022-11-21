import React, {useCallback, useMemo} from 'react'
import {
  insert,
  set,
  setIfMissing,
  ArrayOfObjectsItemMember,
  ArrayOfObjectsItem,
  ArrayOfObjectsInputProps,
} from 'sanity'
import {Button, Grid, Stack, useToast} from '@sanity/ui'
import {AddIcon, RestoreIcon} from '@sanity/icons'

import {Language, Value, ArraySchemaWithLanguageOptions} from '../types'
import Feedback from './Feedback'

export type InternationalizedArrayProps = ArrayOfObjectsInputProps<
  Value,
  ArraySchemaWithLanguageOptions
>

export default function InternationalizedArray(props: InternationalizedArrayProps) {
  const {members, value, schemaType, onChange} = props
  const readOnly = typeof schemaType.readOnly === 'boolean' ? schemaType.readOnly : false
  const {options} = schemaType
  const toast = useToast()

  const languages: Language[] = useMemo(() => options?.languages ?? [], [options])

  const handleAddLanguage = useCallback(
    (languageId?: string) => {
      const itemBase = {_type: `${schemaType.name}Value`}

      // Create new items
      const newItems = languageId
        ? // Just one for this language
          [{...itemBase, _key: languageId}]
        : // Or one for every missing language
          languages
            .filter((language) =>
              value?.length ? !value.find((v) => v._key === language.id) : true
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
    [languages, onChange, value]
  )

  // TODO: This is lazy, reordering and re-setting the whole array – it could be surgical
  const handleRestoreOrder = useCallback(() => {
    if (!value?.length) {
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
    return value?.every((v) => languages.find((l) => l?.id === v?._key))
  }, [value, languages])

  // Check languages are in the correct order
  const languagesInUse = languages.filter((l) => value?.find((v) => v._key === l.id))
  const languagesOutOfOrder = useMemo(() => {
    if (!value?.length) {
      return []
    }

    return value
      .map((v, vIndex) => (vIndex === languagesInUse.findIndex((l) => l.id === v._key) ? null : v))
      .filter(Boolean)
  }, [value, languagesInUse])

  const languagesAreValid = useMemo(
    () =>
      !languages?.length || (languages?.length && languages.every((item) => item.id && item.title)),
    [languages]
  )

  if (!languagesAreValid) {
    return <Feedback />
  }

  return (
    <Stack space={2}>
      {members?.length > 0 ? (
        <>
          {/* TODO: Resolve type for ArrayOfObjectsItemMember */}
          {/* @ts-ignore */}
          {members.map((member: ArrayOfObjectsItemMember) => {
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
      {languagesOutOfOrder.length > 0 && allKeysAreLanguages ? (
        <Button
          tone="caution"
          icon={RestoreIcon}
          onClick={() => handleRestoreOrder()}
          text="Restore order of languages"
        />
      ) : null}

      {/* Show buttons if languages are configured */}
      {/* Hide them once languages have values */}
      {languages?.length > 0 && languagesInUse.length < languages.length ? (
        <Stack space={2}>
          {/* No more than 5 columns */}
          <Grid columns={Math.min(languages.length, 5)} gap={2}>
            {languages.map((language) => (
              <Button
                key={language.id}
                tone="primary"
                mode="ghost"
                fontSize={1}
                disabled={readOnly || Boolean(value?.find((item) => item._key === language.id))}
                text={language.id.toUpperCase()}
                icon={AddIcon}
                onClick={() => handleAddLanguage(language.id)}
              />
            ))}
          </Grid>
          <Button
            tone="primary"
            mode="ghost"
            disabled={readOnly || (value && value?.length >= languages?.length)}
            icon={AddIcon}
            text={
              value?.length
                ? `Add missing ${languages.length - value.length === 1 ? `language` : `languages`}`
                : `Add all languages`
            }
            onClick={() => handleAddLanguage()}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}