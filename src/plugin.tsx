import {definePlugin, isObjectInputProps} from 'sanity'

import {InternationalizedArrayProvider} from './components/InternationalizedArrayContext'
import InternationalizedField from './components/InternationalizedField'
import Preload from './components/Preload'
import {CONFIG_DEFAULT} from './constants'
import {internationalizedArrayFieldAction} from './fieldActions'
import array from './schema/array'
import object from './schema/object'
import {PluginConfig} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

export const internationalizedArray = definePlugin<PluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {
    apiVersion = '2025-10-15',
    select,
    languages,
    fieldTypes,
    defaultLanguages,
    buttonLocations,
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
      unstable_fieldActions: buttonLocations.includes('unstable__fieldAction')
        ? (prev) => [...prev, internationalizedArrayFieldAction]
        : undefined,
    },
    // Wrap document editor with a language provider
    form: {
      components: {
        field: (props) => <InternationalizedField {...props} />,

        input: (props) => {
          const isRootInput = props.id === 'root' && isObjectInputProps(props)

          if (!isRootInput) {
            return props.renderDefault(props)
          }

          const flatFieldTypeNames = flattenSchemaType(props.schemaType).map(
            (field) => field.type.name
          )
          const hasInternationalizedArray = flatFieldTypeNames.some((name) =>
            name.startsWith('internationalizedArray')
          )

          if (!hasInternationalizedArray) {
            return props.renderDefault(props)
          }

          return (
            <InternationalizedArrayProvider
              {...props}
              internationalizedArray={pluginConfig}
            />
          )
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
})
