import {FieldProps} from 'sanity'

export default function InternationalizedField(props: FieldProps) {
  // Show reference field selector if there's a value
  if (props.schemaType.name === 'reference' && props.value) {
    return props.renderDefault({
      ...props,
      title: '',
      level: 0,
    })
  }

  return props.children
}
