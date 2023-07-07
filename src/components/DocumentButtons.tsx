import {Stack} from '@sanity/ui'
import {ObjectInputProps} from 'sanity'

export default function DocumentButtons(props: ObjectInputProps) {
  console.log(props.schemaType.fields)

  return (
    <Stack space={4}>
      <div>Buttons go here</div>
      {props.renderDefault(props)}
    </Stack>
  )
}
