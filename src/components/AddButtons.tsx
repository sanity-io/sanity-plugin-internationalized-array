import {AddIcon} from '@sanity/icons'
import {Button, Grid} from '@sanity/ui'
import type React from 'react'

import {MAX_COLUMNS} from '../constants'
import type {Language, Value} from '../types'

type AddButtonsProps = {
  languages: Language[]
  readOnly: boolean
  value: Value[] | undefined
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export default function AddButtons(props: AddButtonsProps) {
  const {languages, readOnly, value, onClick} = props

  return languages.length > 0 ? (
    <Grid columns={Math.min(languages.length, MAX_COLUMNS)} gap={2}>
      {languages.map((language) => (
        <Button
          key={language.id}
          tone="primary"
          mode="ghost"
          fontSize={1}
          disabled={
            readOnly ||
            Boolean(value?.find((item) => item._key === language.id))
          }
          text={language.id.toUpperCase()}
          // Only show plus icon if there's one row or less
          icon={languages.length > MAX_COLUMNS ? undefined : AddIcon}
          value={language.id}
          onClick={onClick}
        />
      ))}
    </Grid>
  ) : null
}
