import {PluginConfig} from './types'

export const MAX_COLUMNS = {
  codeOnly: 5,
  titleOnly: 4,
  titleAndCode: 3,
}

export const CONFIG_DEFAULT: Required<PluginConfig> = {
  languages: [],
  select: {},
  defaultLanguages: [],
  fieldTypes: [],
  apiVersion: '2022-11-27',
  buttonLocations: ['field'],
  buttonAddAll: true,
  languageDisplay: 'codeOnly',
}
