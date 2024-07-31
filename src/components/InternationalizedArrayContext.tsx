import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Stack} from '@sanity/ui'
import equal from 'fast-deep-equal'
import {createContext, useContext, useDeferredValue, useMemo} from 'react'
import {
  type ObjectInputProps,
  useClient,
  useFormBuilder,
  useWorkspace,
} from 'sanity'
import {suspend} from 'suspend-react'

import {namespace, version} from '../cache'
import {CONFIG_DEFAULT} from '../constants'
import {Language, PluginConfig, Translator} from '../types'
import DocumentAddButtons from './DocumentAddButtons'
import {getSelectedValue} from './getSelectedValue'

// This provider makes the plugin config available to all components in the document form
// But with languages resolved and filtered languages updated base on @sanity/language-filter

type InternationalizedArrayContextProps = Required<
  Omit<PluginConfig, 'translator'>
> & {
  languages: Language[]
  filteredLanguages: Language[]
  translator?: Translator
}

export const InternationalizedArrayContext =
  createContext<InternationalizedArrayContextProps>({
    ...CONFIG_DEFAULT,
    languages: [],
    filteredLanguages: [],
    translator: undefined,
  })

export function useInternationalizedArrayContext() {
  return useContext(InternationalizedArrayContext)
}

type InternationalizedArrayProviderProps = ObjectInputProps & {
  internationalizedArray: Required<Omit<PluginConfig, 'translator'>> & {
    translator?: Translator
  }
}

export function InternationalizedArrayProvider(
  props: InternationalizedArrayProviderProps
) {
  const {internationalizedArray} = props

  const client = useClient({apiVersion: internationalizedArray.apiVersion})
  const workspace = useWorkspace()
  const {value: document} = useFormBuilder()
  const deferredDocument = useDeferredValue(document)
  const selectedValue = useMemo(
    () => getSelectedValue(internationalizedArray.select, deferredDocument),
    [internationalizedArray.select, deferredDocument]
  )

  // Fetch or return languages
  const languages = Array.isArray(internationalizedArray.languages)
    ? internationalizedArray.languages
    : suspend(
        // eslint-disable-next-line require-await
        async () => {
          if (typeof internationalizedArray.languages === 'function') {
            return internationalizedArray.languages(client, selectedValue)
          }
          return internationalizedArray.languages
        },
        [version, namespace, selectedValue, workspace],
        {equal}
      )

  // Filter out some languages if language filter is enabled
  const {selectedLanguageIds, options: languageFilterOptions} =
    useLanguageFilterStudioContext()

  const filteredLanguages = useMemo(() => {
    const documentType = deferredDocument ? deferredDocument._type : undefined
    const languageFilterEnabled =
      typeof documentType === 'string' &&
      languageFilterOptions.documentTypes.includes(documentType)

    return languageFilterEnabled
      ? languages.filter((language) =>
          selectedLanguageIds.includes(language.id)
        )
      : languages
  }, [deferredDocument, languageFilterOptions, languages, selectedLanguageIds])

  const showDocumentButtons =
    internationalizedArray.buttonLocations.includes('document')

  return (
    <InternationalizedArrayContext.Provider
      value={{
        ...internationalizedArray,
        languages,
        filteredLanguages,
      }}
    >
      {showDocumentButtons ? (
        <Stack space={5}>
          <DocumentAddButtons
            value={props.value}
            translator={internationalizedArray.translator}
            excludeValues={internationalizedArray.excludeValues}
          />
          {props.renderDefault(props)}
        </Stack>
      ) : (
        props.renderDefault(props)
      )}
    </InternationalizedArrayContext.Provider>
  )
}
