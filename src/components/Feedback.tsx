import {Card, Code, Stack, Text} from '@sanity/ui'
import type React from 'react'

const schemaExample = {
  languages: [
    {id: 'en', title: 'English'},
    {id: 'no', title: 'Norsk'},
  ],
}

export default function Feedback(): React.ReactElement {
  return (
    <Card tone="caution" border radius={2} padding={3}>
      <Stack space={4}>
        <Text>
          An array of language objects must be passed into the{' '}
          <code>internationalizedArray</code> helper function, each with an{' '}
          <code>id</code> and <code>title</code> field. Example:
        </Text>
        <Card padding={2} border radius={2}>
          <Code size={1} language="javascript">
            {JSON.stringify(schemaExample, null, 2)}
          </Code>
        </Card>
      </Stack>
    </Card>
  )
}
