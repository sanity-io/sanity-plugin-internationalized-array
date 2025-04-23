import type {ReactNode} from 'react'
import {type FieldProps} from 'sanity'

import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

export default function InternationalizedField(props: FieldProps): ReactNode {
  const {languages} = useInternationalizedArrayContext()

  // hide the title?
  type LanguageKey = {_key: string}
  const languageId: LanguageKey = props.path.slice(0, -1)[1] as LanguageKey
  const hasValidLanguageId: boolean = languageId
    ? languages.find((l) => l.id === languageId?._key) !== undefined
    : false
  const hideTitle = props.title?.toLowerCase() === 'value' && hasValidLanguageId
  const customProps: FieldProps = {
    ...props,
    title: hideTitle ? '' : props.title,
  }

  if (!customProps.schemaType.name.startsWith('internationalizedArray')) {
    return customProps.renderDefault(customProps)
  }

  // Show reference field selector if there's a value
  if (customProps.schemaType.name === 'reference' && customProps.value) {
    return customProps.renderDefault({
      ...customProps,
      title: '',
      level: 0, // Reset the level to avoid nested styling
    })
  }

  // For basic field types, we can use children to keep the simple input
  if (
    customProps.schemaType.name === 'string' ||
    customProps.schemaType.name === 'number' ||
    customProps.schemaType.name === 'text'
  ) {
    return customProps.children
  }

  // For complex fields (like markdown), we need to use renderDefault
  // to get all the field's functionality
  return customProps.renderDefault({
    ...customProps,
    level: 0, // Reset the level to avoid nested styling
  })
}
