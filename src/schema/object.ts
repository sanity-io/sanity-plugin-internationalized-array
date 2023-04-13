import {defineField, FieldDefinition} from 'sanity'

import {createFieldName} from '../components/createFieldName'
import InternationalizedField from '../components/InternationalizedField'
import InternationalizedInput from '../components/InternationalizedInput'

type ObjectFactoryConfig = {
  type: string | FieldDefinition
}

export default (config: ObjectFactoryConfig): FieldDefinition<'object'> => {
  const {type} = config
  const typeName = typeof type === `string` ? type : type.name
  const objectName = createFieldName(typeName, true)

  return defineField({
    name: objectName,
    title: `Internationalized array ${type}`,
    type: 'object',
    components: {
      item: InternationalizedInput,
    },
    // TODO: Address this typing issue with the inner object
    // @ts-expect-error
    fields: [
      typeof type === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'value',
            type,
            components: {
              // TODO: Address this typing issue with the inner object
              // @ts-expect-error
              field: InternationalizedField,
            },
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...type,
            name: 'value',
            components: {
              field: InternationalizedField,
            },
          },
    ],
    preview: {
      select: {
        title: 'value',
        subtitle: '_key',
      },
    },
  })
}
