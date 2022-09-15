import {defineField, Schema} from 'sanity'

import {createFieldName} from '../components/createFieldName'

type ObjectFactoryConfig = {
  type: string | Schema.FieldDefinition
}

export default (config: ObjectFactoryConfig): Schema.FieldDefinition<'object'> => {
  const {type} = config
  const typeName = typeof type === `string` ? type : type.name
  const objectName = createFieldName(typeName, true)

  return defineField({
    name: objectName,
    title: `Internationalized array ${type}`,
    type: 'object',
    // @ts-ignore
    fields: [
      typeof type === `string`
        ? // Define a basic field if all we have is the string name
          defineField({
            name: 'value',
            type,
          })
        : // Pass in the configured options, but overwrite the name
          {...type, name: 'value'},
    ],
  })
}
