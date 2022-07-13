import React from 'react'

export function useUnsetInputComponent(type, component) {
  return React.useMemo(() => unsetInputComponent(type, component), [type, component])
}

function unsetInputComponent(type, component) {
  const t = {
    ...type,
    inputComponent: type.inputComponent === component ? undefined : type.inputComponent,
  }
  const typeOfType = t.type ? unsetInputComponent(t.type, component) : undefined
  return {
    ...t,
    type: typeOfType,
  }
}
