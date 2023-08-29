import {isDocumentSchemaType, ObjectField, Path, SchemaType} from 'sanity'

type ObjectFieldWithPath = ObjectField<SchemaType> & {path: Path}

/**
 * Flattens a document's schema type into a flat array of fields and includes their path
 */
export function flattenSchemaType(
  schemaType: SchemaType
): ObjectFieldWithPath[] {
  if (!isDocumentSchemaType(schemaType)) {
    console.error(`Schema type is not a document`)
    return []
  }

  return extractInnerFields(schemaType.fields, [], 3)
}

function extractInnerFields(
  fields: ObjectField<SchemaType>[],
  path: Path,
  maxDepth: number
): ObjectFieldWithPath[] {
  if (path.length >= maxDepth) {
    return []
  }

  return fields.reduce<ObjectFieldWithPath[]>((acc, field) => {
    const thisFieldWithPath = {path: [...path, field.name], ...field}

    if (field.type.jsonType === 'object') {
      const innerFields = extractInnerFields(
        field.type.fields,
        [...path, field.name],
        maxDepth
      )

      return [...acc, thisFieldWithPath, ...innerFields]
    } else if (field.type.jsonType === 'array' && field.type.of.length) {
      const innerFields = extractInnerFields(
        // TODO: Fix TS assertion for array fields
        // @ts-expect-error
        field.type.of[0].fields,
        [...path, field.name],
        maxDepth
      )

      return [...acc, thisFieldWithPath, ...innerFields]
    }

    return [...acc, thisFieldWithPath]
  }, [])
}
