import {AddIcon} from '@sanity/icons'
import {Button, Grid} from '@sanity/ui'
import type React from 'react'
import {memo} from 'react'

import {MAX_COLUMNS} from '../constants'
import type {Language, Value} from '../types'
import {getLanguageDisplay} from '../utils/getLanguageDisplay'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type AddButtonsProps = {
  languages: Language[]
  readOnly: boolean
  value: Value[] | undefined
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

function AddButtons(props: AddButtonsProps) {
  const {languages, readOnly, value, onClick} = props
  const {languageDisplay} = useInternationalizedArrayContext()

  return languages.length > 0 ? (
    <Grid
      columns={Math.min(languages.length, MAX_COLUMNS[languageDisplay])}
      gap={2}
    >
      {languages.map((language) => {
        const languageTitle: string = getLanguageDisplay(
          languageDisplay,
          language.title,
          language.id
        )
        return (
          <Button
            key={language.id}
            tone="primary"
            mode="ghost"
            fontSize={1}
            disabled={
              readOnly ||
              Boolean(value?.find((item) => item._key === language.id))
            }
            text={languageTitle}
            // Only show plus icon if there's one row or less AND only showing codes
            icon={
              languages.length > MAX_COLUMNS[languageDisplay] &&
              languageDisplay === 'codeOnly'
                ? undefined
                : AddIcon
            }
            value={language.id}
            onClick={onClick}
          />
        )
      })}
    </Grid>
  ) : null
}

export default memo(AddButtons)
