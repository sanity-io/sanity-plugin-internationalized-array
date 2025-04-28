import {defineField, FieldDefinition} from 'sanity'

import {createFieldName} from '../components/createFieldName'
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
      // @ts-expect-error - fix typings
      item: InternationalizedInput,
    },
    fields: [
      defineField({
        ...(typeof type === 'string' ? {type} : type),
        name: 'value',
      }),
    ],
    preview: {
      select: {
        title: 'value',
        subtitle: '_key',
      },
    },
  })
}
