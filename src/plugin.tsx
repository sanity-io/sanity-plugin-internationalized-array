import {definePlugin, isObjectInputProps} from 'sanity'

import {InternationalizedArrayProvider} from './components/InternationalizedArrayContext'
import Preload from './components/Preload'
import {internationalizedArrayFieldAction} from './fieldActions'
import array from './schema/array'
import object from './schema/object'
import {PluginConfig} from './types'

const CONFIG_DEFAULT: Required<PluginConfig> = {
  languages: [],
  select: {},
  defaultLanguages: [],
  fieldTypes: [],
  apiVersion: '2022-11-27',
}

export const internationalizedArray = definePlugin<PluginConfig>(
  (config = CONFIG_DEFAULT) => {
    const pluginConfig = {...CONFIG_DEFAULT, ...config}
    const {
      apiVersion = '2022-11-27',
      select,
      languages,
      fieldTypes,
      defaultLanguages,
    } = pluginConfig

    return {
      name: 'sanity-plugin-internationalized-array',
      // Preload languages for use throughout the Studio
      studio: Array.isArray(languages)
        ? undefined
        : {
            components: {
              layout: (props) => (
                <>
                  <Preload apiVersion={apiVersion} languages={languages} />
                  {props.renderDefault(props)}
                </>
              ),
            },
          },
      // Optional: render "add language" buttons as field actions
      document: {
        unstable_fieldActions: (prev) => [
          ...prev,
          internationalizedArrayFieldAction,
        ],
      },
      // Wrap document editor with a language provider
      form: {
        components: {
          input: (props) => {
            const isRootInput = props.id === 'root' && isObjectInputProps(props)

            if (!isRootInput) {
              return props.renderDefault(props)
            }

            const rootFieldTypeNames = props.schemaType.fields.map(
              (field) => field.type.name
            )

            const hasInternationalizedArray = rootFieldTypeNames.some((name) =>
              name.startsWith('internationalizedArray')
            )

            if (!hasInternationalizedArray) {
              return props.renderDefault(props)
            }

            return InternationalizedArrayProvider({
              ...props,
              internationalizedArray: pluginConfig,
            })
          },
        },
      },
      // Register custom schema types for the outer array and the inner object
      schema: {
        types: [
          ...fieldTypes.map((type) =>
            array({type, apiVersion, select, languages, defaultLanguages})
          ),
          ...fieldTypes.map((type) => object({type})),
        ],
      },
    }
  }
)
