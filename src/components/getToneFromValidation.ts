import {CardTone} from '@sanity/ui'
import {FormNodeValidation} from 'sanity'

export function getToneFromValidation(
  validations: FormNodeValidation[]
): CardTone | undefined {
  if (!validations?.length) {
    return undefined
  }

  const validationLevels = validations.map((v) => v.level)

  if (validationLevels.includes('error')) {
    return `critical`
  } else if (validationLevels.includes('warning')) {
    return `caution`
  }

  return undefined
}
