/* eslint-disable no-console */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2023-06-30'})

// This example shows how you may write a migration script that migrates
// an internationalized object to an internationalized array

// Transforms fields from:
// "greeting" {
//   "en": "hello",
//   "fr": "bonjour"
// }

// To:
// "greeting": [
//   { "_key": "en", "value": "hello" },
//   { "_key": "fr", "value": "bonjour" },
// ]

// This will migrate documents in batches of 100 and continue patching until no more documents are
// returned from the query.

// This script can safely be run, even if documents are being concurrently modified by others.
// If a document gets modified in the time between fetch => submit patch, this script will fail,
// but can safely be re-run multiple times until it eventually runs out of documents to migrate.

// A few things to note:
// - This script will exit if any of the mutations fail due to a revision mismatch (which means the
//   document was edited between fetch => update)
// - The query must eventually return an empty set, or else this script will continue indefinitely

// Fetching documents that matches the precondition for the migration.
// NOTE: This query should eventually return an empty set of documents to mark the migration
// as complete

// 1. Take a backup of your dataset
// `npx sanity@latest dataset export`
// Consider making a duplicate and testing the migration on that first

// 2. Modify this "TYPE" and "FIELD_NAME" variables
// to match the data you need to change

const TYPE = `presenter`
const FIELD_NAME = `title`

// 3. Run this script with:
// `npx sanity@latest exec ./migrations/transformObjectToArray.ts --with-user-token`

const fetchDocuments = () =>
  client.fetch(
    `*[_type == $type 
        && defined(${FIELD_NAME}) 
        && count(${FIELD_NAME}) == null
    ][0...100] {_id, _rev, ${FIELD_NAME}}`,
    {type: TYPE}
  )

const buildPatches = (docs) =>
  docs.map((doc) => ({
    id: doc._id,
    patch: {
      set: {
        // Convert existing object to array
        [FIELD_NAME]: Object.keys(doc[FIELD_NAME])
          .filter((key) => key !== '_type')
          .map((key) => ({
            _key: key,
            value: doc[FIELD_NAME][key],
          })),
      },
      // this will cause the migration to fail if any of the documents has been
      // modified since it was fetched.
      ifRevisionID: doc._rev,
    },
  }))

const createTransaction = (patches) =>
  patches.reduce(
    (tx, patch) => tx.patch(patch.id, patch.patch),
    client.transaction()
  )

const commitTransaction = (tx) => tx.commit()

const migrateNextBatch = async () => {
  const documents = await fetchDocuments()
  const patches = buildPatches(documents)
  if (patches.length === 0) {
    console.log('No more documents to migrate!')
    return null
  }
  console.log(
    `Migrating batch:\n %s`,
    patches
      .map((patch) => `${patch.id} => ${JSON.stringify(patch.patch)}`)
      .join('\n')
  )
  const transaction = createTransaction(patches)
  await commitTransaction(transaction)
  return migrateNextBatch()
}

migrateNextBatch().catch((err) => {
  console.error(err)

  throw new Error('Migration failed')
})
