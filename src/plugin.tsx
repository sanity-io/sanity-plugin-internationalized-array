import {createPlugin} from 'sanity'
import {PluginConfig} from './types'
import array from './schema/array'
import object from './schema/object'

const CONFIG_DEFAULT = {
  languages: [],
  fieldTypes: [],
}

export const internationalizedArray = createPlugin<PluginConfig>((config = CONFIG_DEFAULT) => {
  const {languages, fieldTypes} = {...CONFIG_DEFAULT, ...config}

  return {
    name: 'sanity-plugin-internationalized-array',
    schema: {
      types: [
        ...fieldTypes.map((type) => array({type, languages})),
        ...fieldTypes.map((type) => object({type})),
      ],
    },
  }
})
