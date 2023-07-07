import {definePlugin, isObjectInputProps} from 'sanity'

import DocumentButtons from './components/DocumentButtons'
import Preload from './components/Preload'
import array from './schema/array'
import object from './schema/object'
import {PluginConfig} from './types'

const CONFIG_DEFAULT: Required<PluginConfig> = {
  languages: [],
  select: {},
  defaultLanguages: [],
  fieldTypes: [],
  apiVersion: '2023-06-30',
  buttonsLocation: 'field',
}

export const internationalizedArray = definePlugin<PluginConfig>(
  (config = CONFIG_DEFAULT) => {
    const {
      apiVersion,
      select,
      languages,
      fieldTypes,
      defaultLanguages,
      buttonsLocation,
    } = {
      ...CONFIG_DEFAULT,
      ...config,
    }

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
      // Register custom schema types for the outer array and the inner object
      schema: {
        types: [
          ...fieldTypes.map((type) =>
            array({type, apiVersion, select, languages, defaultLanguages})
          ),
          ...fieldTypes.map((type) => object({type})),
        ],
      },
      form: {
        components: {
          input: (props) => {
            if (buttonsLocation !== 'document') {
              return props.renderDefault(props)
            }

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

            return DocumentButtons(props)
          },
        },
      },
    }
  }
)
