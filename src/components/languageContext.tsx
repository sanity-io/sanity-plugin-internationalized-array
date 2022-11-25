import React from 'react'

import {Language} from '../types'

export const LanguageContext = React.createContext<{languages: Language[]}>({
  languages: [],
})

export const LanguageProvider = LanguageContext.Provider
