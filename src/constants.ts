import {PluginConfig} from './types'

export const MAX_COLUMNS = 7

export const CONFIG_DEFAULT: Required<PluginConfig> = {
  languages: [],
  select: {},
  defaultLanguages: [],
  fieldTypes: [],
  apiVersion: '2022-11-27',
  buttonLocations: ['field'],
  buttonAddAll: true,
  addLanguagePatchTransform: (patch) => patch,
}
