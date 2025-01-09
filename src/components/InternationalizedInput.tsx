import {RemoveCircleIcon} from '@sanity/icons'
import {
  Button,
  Card,
  Flex,
  Label,
  Menu,
  MenuButton,
  MenuItem,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'
import type React from 'react'
import {useCallback, useMemo} from 'react'
import {type ObjectItemProps, useFormValue} from 'sanity'
import {set, unset} from 'sanity'

import {getLanguageDisplay} from '../utils/getLanguageDisplay'
import {getToneFromValidation} from './getToneFromValidation'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type InternationalizedValue = {
  _type: string
  _key: string
  value: string
}

export default function InternationalizedInput(
  props: ObjectItemProps<InternationalizedValue>
) {
  const parentValue = useFormValue(
    props.path.slice(0, -1)
  ) as InternationalizedValue[]

  const inlineProps = {
    ...props.inputProps,
    // This is the magic that makes inline editing work?
    members: props.inputProps.members.filter(
      (m) => m.kind === 'field' && m.name === 'value'
    ),
    // This just overrides the type
    // TODO: Remove this as it shouldn't be necessary?
    value: props.value as InternationalizedValue,
  }

  const {validation, value, onChange, readOnly} = inlineProps

  // The parent array contains the languages from the plugin config
  const {languages, languageDisplay, defaultLanguages} =
    useInternationalizedArrayContext()

  const languageKeysInUse = useMemo(
    () => parentValue?.map((v) => v._key) ?? [],
    [parentValue]
  )
  const keyIsValid = languages?.length
    ? languages.find((l) => l.id === value._key)
    : false

  // Changes the key of this item, ideally to a valid language
  const handleKeyChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const languageId = event?.currentTarget?.value

      if (
        !value ||
        !languages?.length ||
        !languages.find((l) => l.id === languageId)
      ) {
        return
      }

      onChange([set(languageId, ['_key'])])
    },
    [onChange, value, languages]
  )

  // Removes this item from the array
  const handleUnset = useCallback(() => {
    onChange(unset())
  }, [onChange])

  if (!languages) {
    return <Spinner />
  }

  const language = languages.find((l) => l.id === value._key)
  const languageTitle: string =
    keyIsValid && language
      ? getLanguageDisplay(languageDisplay, language.title, language.id)
      : ''

  const isDefault = defaultLanguages.includes(value._key)

  const removeButton = (
    <Button
      mode="bleed"
      icon={RemoveCircleIcon}
      tone="critical"
      disabled={readOnly || isDefault}
      onClick={handleUnset}
    />
  )

  return (
    <Card paddingTop={2} tone={getToneFromValidation(validation)}>
      <Stack space={2}>
        <Card tone="inherit">
          {keyIsValid ? (
            <Label muted size={1}>
              {languageTitle}
            </Label>
          ) : (
            <MenuButton
              button={<Button fontSize={1} text={`Change "${value._key}"`} />}
              id={`${value._key}-change-key`}
              menu={
                <Menu>
                  {languages.map((lang) => (
                    <MenuItem
                      disabled={languageKeysInUse.includes(lang.id)}
                      fontSize={1}
                      key={lang.id}
                      text={lang.id.toLocaleUpperCase()}
                      value={lang.id}
                      // @ts-expect-error - fix typings
                      onClick={handleKeyChange}
                    />
                  ))}
                </Menu>
              }
              popover={{portal: true}}
            />
          )}
        </Card>
        <Flex align="center" gap={2}>
          <Card flex={1} tone="inherit">
            {props.inputProps.renderInput(props.inputProps)}
          </Card>

          <Card tone="inherit">
            {isDefault ? (
              <Tooltip
                content={
                  <Text muted size={1}>
                    Can&apos;t remove default language
                  </Text>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
                portal
              >
                <span>{removeButton}</span>
              </Tooltip>
            ) : (
              removeButton
            )}
          </Card>
        </Flex>
      </Stack>
    </Card>
  )
}
