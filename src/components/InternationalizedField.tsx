import type {ReactNode} from 'react'
import {useMemo} from 'react'
import {type FieldProps} from 'sanity'

import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

export default function InternationalizedField(props: FieldProps): ReactNode {
  const {languages} = useInternationalizedArrayContext()

  // hide titles for 'value' fields within valid language entries
  const customProps = useMemo(() => {
    const pathSegment = props.path.slice(0, -1)[1]
    const languageId =
      typeof pathSegment === 'object' && '_key' in pathSegment
        ? pathSegment._key
        : undefined
    const hasValidLanguageId = languageId
      ? languages.some((l) => l.id === languageId)
      : false
    const shouldHideTitle =
      props.title?.toLowerCase() === 'value' && hasValidLanguageId

    return {
      ...props,
      title: shouldHideTitle ? '' : props.title,
    }
  }, [props, languages])

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
