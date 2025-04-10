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

  console.log('typeName:', typeName)
  console.log('objectName:', objectName)
  console.log('type:', type)

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
        title: '',
        // components: {
        //   field: InternationalizedField,
        // },
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
