import React, {useCallback, useMemo} from 'react'
import {
  ArrayOfObjectsInputProps,
  ArrayOfObjectsItem,
  unset,
  insert,
  set,
  setIfMissing,
} from 'sanity/form'
import {
  Text,
  Box,
  Button,
  Flex,
  Grid,
  Label,
  MenuButton,
  Stack,
  useToast,
  Menu,
  MenuItem,
} from '@sanity/ui'
import {AddIcon, RemoveIcon, RestoreIcon} from '@sanity/icons'

import {Language, Value, ArraySchemaWithLanguageOptions} from '../types'
import {Table, TableCell, TableRow} from './Table'
import Feedback from './Feedback'
import {getToneFromValidation} from './getToneFromValidation'

export type InternationalizedArrayInputProps = ArrayOfObjectsInputProps<
  Value,
  ArraySchemaWithLanguageOptions
>

export default function InternationalizedArrayInput(props: InternationalizedArrayInputProps) {
  const {members, value, schemaType, onChange} = props
  const readOnly = typeof schemaType.readOnly === 'boolean' ? schemaType.readOnly : false
  const {options} = schemaType
  const toast = useToast()

  const languages: Language[] = useMemo(() => options?.languages ?? [], [options])
  const valueLanguageKeys = useMemo(
    () => value?.map((v) => v._key).filter((key) => languages.find((l) => l.id === key)) ?? [],
    [languages, value]
  )

  const handleAddLanguage = useCallback(
    (languageId?: string) => {
      // Create new items
      const newItems = languageId
        ? // Just one for this language
          [{_key: languageId}]
        : // Or one for every missing language
          languages
            .filter((language) =>
              value?.length ? !value.find((v) => v._key === language.id) : true
            )
            .map((language) => ({_key: language.id}))

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

  const handleUnsetByKey = useCallback(
    (_key: string) => {
      onChange(unset([{_key}]))
    },
    [onChange]
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

    if (value.length !== updatedValue.length) {
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
  const languagesOutOfOrder = useMemo(() => {
    if (!value?.length) {
      return []
    }

    const languagesInUse = languages.filter((l) => value.find((v) => v._key === l.id))

    return value
      .map((v, vIndex) => (vIndex === languagesInUse.findIndex((l) => l.id === v._key) ? null : v))
      .filter(Boolean)
  }, [value, languages])

  const handleKeyChange = useCallback(
    (config: {from: string; to: string; index: number}) => {
      if (!value) {
        return
      }

      const {from, to, index} = config
      const currentValue = value.find((v) => v._key === from)
      const newValue = {...currentValue, _key: to}

      // TODO: Make sure this gets the correct language index, currently replaces-in-place
      onChange([insert([newValue], 'after', [index]), unset([{_key: from}])])
    },
    [onChange, value]
  )

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
        <Table>
          <tbody>
            {members.map((member, memberIndex) =>
              member.kind === 'item' ? (
                <TableRow
                  key={member.key}
                  tone={
                    member?.item?.validation?.length > 0
                      ? getToneFromValidation(member.item.validation)
                      : undefined
                  }
                >
                  <TableCell style={{verticalAlign: 'bottom'}}>
                    <Box paddingY={3} paddingRight={2}>
                      {valueLanguageKeys.includes(member.key) ? (
                        <Label muted size={1}>
                          {member.key}
                        </Label>
                      ) : (
                        <MenuButton
                          button={<Button fontSize={1} text={`Change "${member.key}"`} />}
                          id={`${member.key}-change-key`}
                          menu={
                            <Menu>
                              {languages.map((language) => (
                                <MenuItem
                                  disabled={valueLanguageKeys.includes(language.id)}
                                  fontSize={1}
                                  key={language.id}
                                  text={language.id.toLocaleUpperCase()}
                                  onClick={() =>
                                    handleKeyChange({
                                      from: member.key,
                                      to: language.id,
                                      index: memberIndex,
                                    })
                                  }
                                />
                              ))}
                            </Menu>
                          }
                          placement="right"
                          popover={{portal: true}}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell paddingRight={2} style={{width: `100%`}}>
                    {/* This renders the entire field default with title */}
                    <ArrayOfObjectsItem {...props} member={member} />
                  </TableCell>
                  <TableCell style={{verticalAlign: 'bottom'}}>
                    <Flex align="center" justify="flex-end" gap={3}>
                      <Button
                        mode="ghost"
                        icon={RemoveIcon}
                        tone="critical"
                        disabled={typeof readOnly === 'boolean' ? readOnly : false}
                        onClick={() => handleUnsetByKey(member.key)}
                      />
                    </Flex>
                  </TableCell>
                </TableRow>
              ) : (
                <Text>Error</Text>
              )
            )}
          </tbody>
        </Table>
      ) : null}

      {languagesOutOfOrder.length > 0 && allKeysAreLanguages ? (
        <Button
          tone="caution"
          icon={RestoreIcon}
          onClick={() => handleRestoreOrder()}
          text="Restore order of languages"
        />
      ) : null}

      {languages?.length > 0 ? (
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
            text={value?.length ? `Add missing languages` : `Add all languages`}
            onClick={() => handleAddLanguage()}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
