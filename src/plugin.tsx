import {definePlugin} from 'sanity'
import {PluginConfig} from './types'
import array from './schema/array'
import object from './schema/object'
import {PluginConfig} from './types'

const CONFIG_DEFAULT: PluginConfig = {
  languages: [],
  fieldTypes: [],
}

export const internationalizedArray = definePlugin<PluginConfig>((config = CONFIG_DEFAULT) => {
  const {apiVersion = '2022-11-27', languages, fieldTypes} = {...CONFIG_DEFAULT, ...config}

  return {
    name: 'sanity-plugin-internationalized-array',
    schema: {
      types: [
        ...fieldTypes.map((type) => array({type, apiVersion, languages})),
        ...fieldTypes.map((type) => object({type})),
      ],
    },
  }
})
