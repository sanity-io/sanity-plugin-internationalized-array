import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Stack} from '@sanity/ui'
import equal from 'fast-deep-equal'
import type React from 'react'
import {createContext, useContext, useDeferredValue, useMemo} from 'react'
import {type ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {suspend} from 'suspend-react'

import {createCacheKey, setFunctionCache} from '../cache'
import {CONFIG_DEFAULT} from '../constants'
import type {Language, PluginConfig} from '../types'
import DocumentAddButtons from './DocumentAddButtons'
import {getSelectedValue} from './getSelectedValue'

// This provider makes the plugin config available to all components in the document form
// But with languages resolved and filtered languages updated base on @sanity/language-filter

type InternationalizedArrayContextProps = Required<PluginConfig> & {
  languages: Language[]
  filteredLanguages: Language[]
}

export const InternationalizedArrayContext =
  createContext<InternationalizedArrayContextProps>({
    ...CONFIG_DEFAULT,
    languages: [],
    filteredLanguages: [],
  })

export function useInternationalizedArrayContext(): InternationalizedArrayContextProps {
  return useContext(InternationalizedArrayContext)
}

type InternationalizedArrayProviderProps = ObjectInputProps & {
  internationalizedArray: Required<PluginConfig>
}

export function InternationalizedArrayProvider(
  props: InternationalizedArrayProviderProps
): React.ReactElement {
  const {internationalizedArray} = props

  const client = useClient({apiVersion: internationalizedArray.apiVersion})
  const workspace = useWorkspace()
  const {formState} = useDocumentPane()
  const deferredDocument = useDeferredValue(formState?.value)
  const selectedValue = useMemo(
    () => getSelectedValue(internationalizedArray.select, deferredDocument),
    [internationalizedArray.select, deferredDocument]
  )

  // Use a stable workspace identifier to prevent unnecessary re-renders
  const workspaceId = useMemo(() => {
    // Use workspace name if available, otherwise create a stable hash
    if (workspace?.name) {
      return workspace.name
    }
    // Create a stable hash from workspace properties that matter for caching
    const workspaceKey = {
      name: workspace?.name,
      title: workspace?.title,
      // Add other stable properties as needed
    }
    return JSON.stringify(workspaceKey)
  }, [workspace])

  // Memoize the cache key to prevent expensive JSON.stringify calls
  const cacheKey = useMemo(
    () => createCacheKey(selectedValue, workspaceId),
    [selectedValue, workspaceId]
  )

  // Fetch or return languages
  const languages = Array.isArray(internationalizedArray.languages)
    ? internationalizedArray.languages
    : suspend(
        // eslint-disable-next-line require-await
        async () => {
          if (typeof internationalizedArray.languages === 'function') {
            const result = await internationalizedArray.languages(
              client,
              selectedValue
            )
            // Populate function cache for use outside React context
            setFunctionCache(
              internationalizedArray.languages,
              selectedValue,
              result,
              workspaceId
            )
            return result
          }
          return internationalizedArray.languages
        },
        cacheKey,
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
  const context = useMemo(
    () => ({...internationalizedArray, languages, filteredLanguages}),
    [filteredLanguages, internationalizedArray, languages]
  )

  return (
    <InternationalizedArrayContext.Provider value={context}>
      {showDocumentButtons ? (
        <Stack space={5}>
          <DocumentAddButtons value={props.value} />
          {props.renderDefault(props)}
        </Stack>
      ) : (
        props.renderDefault(props)
      )}
    </InternationalizedArrayContext.Provider>
  )
}
