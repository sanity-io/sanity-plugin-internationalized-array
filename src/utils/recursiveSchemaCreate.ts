import {SchemaType} from 'sanity'

interface Schema {
  name: string
  type: 'array' | 'object' | 'string' | 'number' | 'boolean'
  children?: Schema[]
  path: (string | number)[]
}
export const recursiveSchemaCreate = (
  schemaType: SchemaType,
  path: (string | number)[] = []
): Schema => {
  if (schemaType.jsonType === 'array') {
    const arrayRootPath = [...path, schemaType.name]

    const ofArraySchemas = schemaType.of
    const arraySchemaResults = ofArraySchemas.map((ofArraySchema, index) => {
      const fieldName = ofArraySchema.name
      const arrayItemPath = [...arrayRootPath, index, fieldName]
      const arraySchema = recursiveSchemaCreate(ofArraySchema, arrayItemPath)
      return {
        name: fieldName,
        type: arraySchema.type,
        children: arraySchema.children,
        path: arrayItemPath,
      }
    })
    return {
      name: schemaType.name,
      type: schemaType.jsonType,
      children: arraySchemaResults,
      path: arrayRootPath,
    }
  }
  if (schemaType.jsonType === 'object') {
    const objectSchemaFields = schemaType.fields
    const objectRootPath = [...path, schemaType.name]
    const objectSchemaResults = objectSchemaFields.map((objectField, index) => {
      const objectSchemaField = objectField.type
      const fieldName = objectField.name
      const objectItemPath = [...objectRootPath, index, fieldName]
      const objectSchema = recursiveSchemaCreate(
        objectSchemaField,
        objectItemPath
      )
      return {
        name: fieldName,
        type: objectSchema.type,
        children: objectSchema.children,
        path: objectItemPath,
      }
    })
    return {
      name: schemaType.name,
      type: schemaType.jsonType,
      children: objectSchemaResults,
      path: objectRootPath,
    }
  }
  return {
    type: schemaType.jsonType,
    name: schemaType.name,
    path: [...path, schemaType.name],
  }
}
