import type {FieldProps} from 'sanity'

export default function InternationalizedField(props: FieldProps) {
  // Show reference field selector if there's a value
  if (props.schemaType.name === 'reference' && props.value) {
    return props.renderDefault({
      ...props,
      title: '',
      level: 0,
    })
  }

  // For basic field types, we can use children to keep the simple input
  if (
    props.schemaType.name === 'string' ||
    props.schemaType.name === 'number' ||
    props.schemaType.name === 'text'
  ) {
    return props.children
  }

  // For complex fields (like markdown), we need to use renderDefault
  // to get all the field's functionality
  return props.renderDefault({
    ...props,
    title: '', // Remove the title since we handle that in the wrapper
    level: 0, // Reset the level to avoid nested styling
  })
}
