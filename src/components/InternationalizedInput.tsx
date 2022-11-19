import {ObjectItemProps, useFormValue} from 'sanity'
import React, {useCallback, useMemo} from 'react'
import {unset, set} from 'sanity'
import {Box, Button, Flex, Label, MenuButton, Menu, MenuItem, Card} from '@sanity/ui'
import {RemoveIcon} from '@sanity/icons'

import {Language} from '../types'
import {getToneFromValidation} from './getToneFromValidation'

type InternationalizedValue = {
  _type: string
  _key: string
  value: string
}

export default function InternationalizedInput(props: ObjectItemProps<InternationalizedValue>) {
  const parentValue = useFormValue(props.path.slice(0, -1)) as InternationalizedValue[]

  const inlineProps = {
    ...props.inputProps,
    // This is the magic that makes inline editing work
    members: props.inputProps.members.filter((m) => m.kind === 'field' && m.name === 'value'),
    // This just overrides the type
    // TODO: Remove this as it shouldn't be necessary
    value: props.value as InternationalizedValue,
  }

  const {validation, value, onChange, readOnly} = inlineProps

  // The parent array contains the languages from the plugin config
  // TODO: fix TS support for overloading options
  const languages: Language[] = useMemo(
    // @ts-ignore
    () => props?.parentSchemaType?.options?.languages ?? [],
    // @ts-ignore
    [props?.parentSchemaType?.options?.languages]
  )
  const languageKeysInUse = useMemo(() => parentValue?.map((v) => v._key) ?? [], [parentValue])
  const keyIsValid = languages.find((l) => l.id === value._key)

  // Changes the key of this item, ideally to a valid language
  const handleKeyChange = useCallback(
    (languageId: string) => {
      if (!value || !languages.find((l) => l.id === languageId)) {
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

  return (
    <Card tone={getToneFromValidation(validation)}>
      <Flex align="flex-end" gap={1}>
        <Card tone="inherit">
          <Box paddingY={3} paddingRight={2}>
            {keyIsValid ? (
              <Label muted size={1}>
                {value._key}
              </Label>
            ) : (
              <MenuButton
                button={<Button fontSize={1} text={`Change "${value._key}"`} />}
                id={`${value._key}-change-key`}
                menu={
                  <Menu>
                    {languages.map((language) => (
                      <MenuItem
                        // TODO: Prevent changing to a key that already exists in the array
                        disabled={languageKeysInUse.includes(language.id)}
                        fontSize={1}
                        key={language.id}
                        text={language.id.toLocaleUpperCase()}
                        onClick={() => handleKeyChange(language.id)}
                      />
                    ))}
                  </Menu>
                }
                placement="right"
                popover={{portal: true}}
              />
            )}
          </Box>
        </Card>

        <Card paddingRight={2} flex={1} tone="inherit">
          {props.inputProps.renderInput(props.inputProps)}
        </Card>

        <Card tone="inherit">
          <Button
            mode="ghost"
            icon={RemoveIcon}
            tone="critical"
            disabled={readOnly}
            onClick={handleUnset}
          />
        </Card>
      </Flex>
    </Card>
  )
}
