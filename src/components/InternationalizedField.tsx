import {SyncIcon} from '@sanity/icons'
import {Box, Button, Flex} from '@sanity/ui'
import React, {useCallback} from 'react'
import {FieldProps, unset, useFormBuilder} from 'sanity'

export default function InternationalizedField(props: FieldProps) {
  const {renderPreview} = useFormBuilder()
  const handleUnset = useCallback(() => {
    props.inputProps.onChange(unset())
  }, [props.inputProps])

  // Show reference field selector if there's a value
  if (props.schemaType.name === 'reference' && props.value) {
    // Shows just the preview, but not the button to remove the value
    // TODO: This is a stop-gap, restore default reference UI behaviour
    return (
      <Flex gap={2}>
        <Box flex={1}>
          {renderPreview({
            layout: 'default',
            schemaType: props.schemaType,
            value: props.value,
          })}
        </Box>
        <Button mode="ghost" icon={SyncIcon} onClick={handleUnset} />
      </Flex>
    )
  }

  return props.children
}
