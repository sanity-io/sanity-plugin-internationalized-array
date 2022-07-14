import React, {forwardRef, useCallback, useMemo} from 'react'
import {Code, Text, Card, Label, Flex, Box, Stack, Button, Grid} from '@sanity/ui'
import {withDocument} from 'part:@sanity/form-builder'
import {PatchEvent, setIfMissing, insert, unset, set} from '@sanity/form-builder/PatchEvent'
import {AddIcon, RemoveIcon, RestoreIcon} from '@sanity/icons'
import {FormFieldValidationStatus} from '@sanity/base/components'
import {FieldPresence} from '@sanity/base/presence'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'

import ValueInput from './ValueInput'
import {useUnsetInputComponent} from './useUnsetInputComponent'

const schemaExample = {
  name: 'title',
  type: 'localisedArray',
  options: {
    languages: [
      {id: 'en', title: 'English'},
      {id: 'no', title: 'Norsk'},
    ],
  },
}

type Value = {
  _key: string
  value?: string
}

type Language = {
  id: string
  title: string
}

type Options = {
  languages: Language[]
  showNativeInput: boolean
}

const DEFAULT_OPTIONS = {
  languages: [],
  showNativeInput: false,
}

const LanguageArrayWrapper = forwardRef(function CustomComponent(props, ref) {
  const {onChange, onBlur, readOnly, presence, markers} = props
  const value: Value[] = props?.value

  // IMPORTANT: leaving out will cause the browser to lock up in an infinite loop
  const type = useUnsetInputComponent(props.type)
  const options: Options = type?.options ?? DEFAULT_OPTIONS
  const {languages, showNativeInput} = options

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

      onChange(PatchEvent.from(setIfMissing([]), ...insertions))
    },
    [languages, onChange, value]
  )

  const handleUnsetByKey = useCallback(
    (_key) => {
      onChange(PatchEvent.from(unset([{_key}])))
    },
    [onChange]
  )

  const handleInnerValueChange = useCallback(
    (patchEvent: PatchEvent, _key: string) => {
      const inputValue = patchEvent.patches[0]?.value
      const inputPath = [{_key}, `value`]

      onChange(PatchEvent.from(inputValue ? set(inputValue, inputPath) : unset(inputPath)))
    },
    [onChange]
  )

  // TODO: This is lazy, reordering and re-setting the whole array – it should be surgical
  const handleRestoreOrder = useCallback(() => {
    // Create a new value array in the correct order
    const updatedValue = value.reduce((acc, v) => {
      const newIndex = languages.findIndex((l) => l.id === v._key)

      acc[newIndex] = v

      return acc
    }, [])

    onChange(PatchEvent.from(unset(), set(updatedValue)))
  }, [languages, onChange, value])

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

  // Check options are supplied and valid
  const languagesAreValid = useMemo(
    () => languages?.length && languages.every((item) => item.id && item.title),
    [languages]
  )

  if (!languagesAreValid) {
    return (
      <Card tone="caution" border radius={2} padding={3}>
        <Stack space={4}>
          <Text>
            An array of language objects must be passed into the <code>{type.name}</code> field as
            options, each with an <code>id</code> and <code>title</code> field. Example:
          </Text>
          <Card padding={2} border radius={2}>
            <Code size={1} language="javascript">
              {JSON.stringify(schemaExample, null, 2)}
            </Code>
          </Card>
        </Stack>
      </Card>
    )
  }

  const validationMarkers = markers?.length
    ? markers.filter((mark) => mark.type === `validation`)
    : []
  const invalidKeys = validationMarkers
    .map((mark) => mark.path)
    .flat()
    .map((item) => item._key)
  console.log(props)

  return (
    <Stack space={3}>
      <Box>
        <Text size={1} weight="bold">
          {type?.title ?? type.name}
        </Text>
      </Box>
      {/* Loop over the values */}
      {value?.length > 0 ? (
        <Card padding={1} border radius={1}>
          <Stack space={1}>
            {value.map((item) => (
              <Card
                paddingY={1}
                paddingX={2}
                key={item._key}
                tone={
                  // TODO: Move this logic somewhere else
                  invalidKeys.includes(item._key)
                    ? `critical`
                    : undefined || languagesOutOfOrder.find((l) => l._key === item._key)
                    ? `caution`
                    : undefined
                }
              >
                <Flex gap={3} align="center">
                  {/* To render each individual field in this type */}
                  {type?.of?.length > 0 &&
                    type?.of.map((subType) => (
                      <Flex key={subType.name} flex={1} align="center" gap={2}>
                        {subType?.fields?.length > 0 ? (
                          <>
                            <Box>
                              <Label>{item._key}</Label>
                            </Box>
                            <Box flex={1}>
                              {/* There _should_ only be one field */}
                              {subType.fields.map((subTypeField, subTypeFieldIndex) => (
                                <ValueInput
                                  key={subTypeField.name}
                                  onChange={(patchEvent) =>
                                    handleInnerValueChange(patchEvent, item._key)
                                  }
                                  onBlur={onBlur}
                                  // We don't want the array item to open onFocus
                                  onFocus={() => null}
                                  path={[{_key: item._key}, subTypeField.name]}
                                  focusPath={[{_key: item._key}, subTypeField.name]}
                                  parent={item}
                                  readOnly={readOnly}
                                  type={subTypeField}
                                  value={item.value}
                                  level={props.level + 1}
                                  markers={[]}
                                  compareValue={
                                    props?.compareValue?.find((c) => c._key === item._key)?.value
                                  }
                                />
                              ))}
                            </Box>
                          </>
                        ) : null}
                      </Flex>
                    ))}
                  {presence?.length > 0 ? (
                    <FieldPresence maxAvatars={1} presence={presence} />
                  ) : null}
                  {invalidKeys.includes(item._key) ? (
                    <FormFieldValidationStatus __unstable_markers={validationMarkers} />
                  ) : null}
                  <Button
                    mode="ghost"
                    icon={RemoveIcon}
                    tone="critical"
                    onClick={() => handleUnsetByKey(item._key)}
                  />
                </Flex>
              </Card>
            ))}
          </Stack>
        </Card>
      ) : null}

      {languagesOutOfOrder.length > 0 ? (
        <Button
          tone="caution"
          disabled={languagesOutOfOrder.length > languages.length}
          icon={RestoreIcon}
          onClick={() => handleRestoreOrder()}
          text="Restore order of languages"
        />
      ) : null}

      {languages.length > 0 ? (
        <Stack space={2}>
          {/* No more than 5 columns */}
          <Grid columns={Math.min(languages.length, 5)} gap={2}>
            {languages.map((language) => (
              <Button
                key={language.id}
                tone="primary"
                mode="ghost"
                fontSize={1}
                disabled={readOnly || value?.find((item) => item._key === language.id)}
                text={language.id.toUpperCase()}
                icon={AddIcon}
                onClick={() => handleAddLanguage(language.id)}
              />
            ))}
          </Grid>
          <Button
            tone="primary"
            mode="ghost"
            disabled={readOnly || value?.length >= languages?.length}
            icon={AddIcon}
            text={value?.length ? `Add missing languages` : `Add all languages`}
            onClick={() => handleAddLanguage()}
          />
        </Stack>
      ) : null}

      {showNativeInput ? <FormBuilderInput {...props} type={type} ref={ref} /> : null}
    </Stack>
  )
})

export default withDocument(LanguageArrayWrapper)
