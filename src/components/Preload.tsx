import {memo} from 'react'
import {useClient} from 'sanity'

import {createCacheKey, peek, preloadWithKey, setFunctionCache} from '../cache'
import type {PluginConfig} from '../types'

export default memo(function Preload(
  props: Required<Pick<PluginConfig, 'apiVersion' | 'languages'>>
) {
  const client = useClient({apiVersion: props.apiVersion})

  // Use the same cache key structure as the main component
  // This should match the main component when selectedValue is empty
  const cacheKey = createCacheKey({})

  if (!Array.isArray(peek({}))) {
    // eslint-disable-next-line require-await
    preloadWithKey(async () => {
      if (Array.isArray(props.languages)) {
        return props.languages
      }
      const result = await props.languages(client, {})
      // Populate function cache for sharing with other components
      // Use the same key structure as the main component
      setFunctionCache(props.languages, {}, result)
      return result
    }, cacheKey)
  }

  return null
})
