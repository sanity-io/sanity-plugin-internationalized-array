import {useMemo} from 'react'
import {FieldProps, isArraySchemaType} from 'sanity'

export default function InternationalizedField(props: FieldProps) {
  const valueFieldIsPortableTextEditor = useMemo(() => {
    return (
      isArraySchemaType(props.schemaType) &&
      props.schemaType.of.find((field) => field.name === 'block')
    )
  }, [props.schemaType])

  if (valueFieldIsPortableTextEditor) {
    console.log(props.schemaType)
    return props.renderDefault(props)
  }

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
