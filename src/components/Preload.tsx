import {peek, preload} from '../cache'
import {memo} from 'react'
import type {PluginConfig} from '../types'
import {useClient} from 'sanity'

export default memo(function Preload(
  props: Required<Pick<PluginConfig, 'apiVersion' | 'languages'>>
) {
  const client = useClient({apiVersion: props.apiVersion})
  if (!Array.isArray(peek())) {
    // eslint-disable-next-line require-await
    preload(async () =>
      Array.isArray(props.languages) ? props.languages : props.languages(client)
    )
  }

  return null
})
