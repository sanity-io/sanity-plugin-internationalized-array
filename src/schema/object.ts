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
    // TODO: Resolve this typing issue with the return type
    // @ts-ignore
    components: {
      // TODO: Resolve this typing issue with the outer component
      // @ts-ignore
      item: InternationalizedInput,
    },
    // TODO: Address this typing issue with the inner object
    // @ts-ignore
    fields: [
      typeof type === `string`
        ? // Define a basic field if all we have is the string name
          defineField({
            name: 'value',
            type: 'string',
            components: {
              // TODO: Address this typing issue with the inner object
              // @ts-ignore
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
