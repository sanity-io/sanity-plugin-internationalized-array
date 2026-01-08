/* eslint-disable no-console */

import {getCliClient} from 'sanity/cli'
import {nanoid} from 'nanoid'

// Migration script: Convert _key-based language identification to dedicated language field
//
// BEFORE (v3.x):
// "greeting": [
//   { "_key": "en", "value": "hello" },
//   { "_key": "fr", "value": "bonjour" }
// ]
//
// AFTER (v4.x):
// "greeting": [
//   { "_key": "abc123", "language": "en", "value": "hello" },
//   { "_key": "def456", "language": "fr", "value": "bonjour" }
// ]
//
// This migration:
// 1. Finds documents with internationalized array fields that lack the `language` property
// 2. Copies the `_key` value to a new `language` field
// 3. Generates a new random `_key` using nanoid
// 4. Uses optimistic locking (ifRevisionID) for safe concurrent execution
//
// The script is idempotent - it can be safely re-run multiple times.

// =============================================================================
// CONFIGURATION - Modify these values for your project
// =============================================================================

/**
 * Document type(s) to migrate. Can be a single type or array of types.
 * Example: 'post' or ['post', 'page', 'product']
 */
const DOCUMENT_TYPES: string | string[] = 'post'

/**
 * Field name(s) containing internationalized arrays.
 * These should match the field names in your schema that use the plugin.
 * Example: 'title' or ['title', 'description', 'body']
 */
const FIELD_NAMES: string | string[] = 'title'

/**
 * Batch size for processing documents. Lower values are safer but slower.
 * Default: 100
 */
const BATCH_SIZE = 100

/**
 * Set to true to preview changes without applying them.
 * Highly recommended to run with DRY_RUN=true first!
 */
const DRY_RUN = true

/**
 * API version for Sanity client
 */
const API_VERSION = '2024-01-01'

// =============================================================================
// MIGRATION LOGIC - Generally no need to modify below this line
// =============================================================================

const client = getCliClient({apiVersion: API_VERSION})

// Normalize config to arrays
const documentTypes = Array.isArray(DOCUMENT_TYPES) ? DOCUMENT_TYPES : [DOCUMENT_TYPES]
const fieldNames = Array.isArray(FIELD_NAMES) ? FIELD_NAMES : [FIELD_NAMES]

/**
 * Build the GROQ query to find documents needing migration.
 *
 * A document needs migration if:
 * - It matches one of the configured document types
 * - It has at least one of the configured fields defined
 * - At least one array item in those fields lacks a `language` property
 */
function buildFetchQuery(): string {
  // Build field existence checks
  const fieldChecks = fieldNames.map((field) => `defined(${field})`).join(' || ')

  // Build migration status checks - find docs where any field has items without language
  const migrationChecks = fieldNames
    .map((field) => `count(${field}[!defined(language)]) > 0`)
    .join(' || ')

  // Build projection to fetch only the fields we need
  const projection = ['_id', '_rev', ...fieldNames].join(', ')

  return `*[
    _type in $types
    && (${fieldChecks})
    && (${migrationChecks})
  ][0...${BATCH_SIZE}] {${projection}}`
}

/**
 * Fetch the next batch of documents that need migration
 */
async function fetchDocuments(): Promise<any[]> {
  const query = buildFetchQuery()

  if (DRY_RUN) {
    console.log('Query:', query)
    console.log('Params:', {types: documentTypes})
  }

  return client.fetch(query, {types: documentTypes})
}

/**
 * Transform a single array item from old format to new format
 */
function transformArrayItem(item: {_key: string; value?: unknown}): {
  _key: string
  language: string
  value?: unknown
} {
  // Copy _key to language, generate new random _key
  return {
    ...item,
    _key: nanoid(),
    language: item._key,
  }
}

/**
 * Build patch operations for a single document
 */
function buildPatch(doc: any): {id: string; patch: any} | null {
  const setOperations: Record<string, any> = {}

  for (const fieldName of fieldNames) {
    const fieldValue = doc[fieldName]

    // Skip if field doesn't exist or is empty
    if (!fieldValue || !Array.isArray(fieldValue) || fieldValue.length === 0) {
      continue
    }

    // Check if any items need migration (lack language field)
    const needsMigration = fieldValue.some((item: any) => !item.language)

    if (needsMigration) {
      // Transform all items in the array
      setOperations[fieldName] = fieldValue.map((item: any) => {
        // Only transform items that don't already have language
        if (item.language) {
          return item
        }
        return transformArrayItem(item)
      })
    }
  }

  // If no fields need migration, skip this document
  if (Object.keys(setOperations).length === 0) {
    return null
  }

  return {
    id: doc._id,
    patch: {
      set: setOperations,
      ifRevisionID: doc._rev,
    },
  }
}

/**
 * Build patches for a batch of documents
 */
function buildPatches(docs: any[]): Array<{id: string; patch: any}> {
  return docs.map(buildPatch).filter((patch): patch is {id: string; patch: any} => patch !== null)
}

/**
 * Create a transaction from patches
 */
function createTransaction(patches: Array<{id: string; patch: any}>) {
  return patches.reduce((tx, {id, patch}) => tx.patch(id, patch), client.transaction())
}

/**
 * Commit a transaction
 */
async function commitTransaction(tx: any): Promise<void> {
  await tx.commit()
}

/**
 * Log patch details for review
 */
function logPatches(patches: Array<{id: string; patch: any}>): void {
  for (const {id, patch} of patches) {
    console.log(`\n${id}:`)
    for (const [field, value] of Object.entries(patch.set)) {
      if (Array.isArray(value)) {
        console.log(`  ${field}: ${value.length} items`)
        for (const item of value as any[]) {
          console.log(`    - _key: ${item._key}, language: ${item.language}`)
        }
      }
    }
  }
}

/**
 * Main migration loop - process batches until no more documents need migration
 */
async function migrateNextBatch(): Promise<void> {
  const documents = await fetchDocuments()

  if (documents.length === 0) {
    console.log('\n✅ No more documents to migrate!')
    return
  }

  console.log(`\nFound ${documents.length} documents to migrate`)

  const patches = buildPatches(documents)

  if (patches.length === 0) {
    console.log('No patches to apply (documents may have been migrated concurrently)')
    return migrateNextBatch()
  }

  console.log(`Built ${patches.length} patches`)
  logPatches(patches)

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - No changes applied')
    console.log('Set DRY_RUN = false to apply these changes')
    return
  }

  console.log('\nApplying patches...')
  const transaction = createTransaction(patches)
  await commitTransaction(transaction)
  console.log('✅ Batch committed successfully')

  // Continue with next batch
  return migrateNextBatch()
}

/**
 * Migration entry point
 */
async function runMigration(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Internationalized Array Migration: _key → language')
  console.log('='.repeat(60))
  console.log('\nConfiguration:')
  console.log(`  Document types: ${documentTypes.join(', ')}`)
  console.log(`  Field names: ${fieldNames.join(', ')}`)
  console.log(`  Batch size: ${BATCH_SIZE}`)
  console.log(`  Dry run: ${DRY_RUN}`)
  console.log('')

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be applied')
    console.log('   Review the output and set DRY_RUN = false to apply changes\n')
  }

  await migrateNextBatch()

  console.log('\n' + '='.repeat(60))
  console.log('Migration complete')
  console.log('='.repeat(60))
}

// Run the migration
runMigration().catch((err) => {
  console.error('\n❌ Migration failed:', err.message)
  console.error(err)
  process.exit(1)
})
