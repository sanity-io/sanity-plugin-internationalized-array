import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import equal from 'fast-deep-equal'
import {createContext, useContext, useDeferredValue, useMemo} from 'react'
import {ObjectInputProps, useClient, useFormBuilder} from 'sanity'
import {suspend} from 'suspend-react'

import {namespace, version} from '../cache'
import {Language, PluginConfig} from '../types'
import {getSelectedValue} from './getSelectedValue'

type InternationalizedArrayContextProps = {
  languages: Language[]
  filteredLanguages: Language[]
}

export const InternationalizedArrayContext =
  createContext<InternationalizedArrayContextProps>({
    languages: [],
    filteredLanguages: [],
  })

export function useInternationalizedArrayContext() {
  return useContext(InternationalizedArrayContext)
}

type InternationalizedArrayProviderProps = ObjectInputProps & {
  internationalizedArray: Required<PluginConfig>
}

export function InternationalizedArrayProvider(
  props: InternationalizedArrayProviderProps
) {
  const {internationalizedArray} = props

  const client = useClient({apiVersion: internationalizedArray.apiVersion})
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
        [version, namespace],
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

  return (
    <InternationalizedArrayContext.Provider
      value={{languages, filteredLanguages}}
    >
      {props.renderDefault(props)}
    </InternationalizedArrayContext.Provider>
  )
}
