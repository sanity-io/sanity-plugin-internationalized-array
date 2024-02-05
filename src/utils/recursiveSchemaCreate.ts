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
type CreateInternationalizedArrayFieldsResult = SchemaType & {
  path: (string | number)[]
}
export const createInternationalizedArrayFields = (
  schemaType: SchemaType,
  path: (string | number)[] = []
): CreateInternationalizedArrayFieldsResult[] => {
  if (schemaType.jsonType === 'array') {
    const arrayRootPath = [...path]

    const ofArraySchemas = schemaType.of
    const arraySchemaResults = ofArraySchemas.reduce<
      CreateInternationalizedArrayFieldsResult[]
    >((acc, ofArraySchema, index) => {
      const fieldName = ofArraySchema.name
      const arrayItemPath = [...arrayRootPath, index]
      const arraySchema = createInternationalizedArrayFields(
        ofArraySchema,
        arrayItemPath
      )
      if (fieldName.startsWith('internationalizedArray')) {
        return [
          ...acc,
          {...ofArraySchema, path: arrayItemPath, name: fieldName},
          ...arraySchema,
        ]
      }
      return [...acc, ...arraySchema]
    }, [])
    if (schemaType.name.startsWith('internationalizedArray')) {
      return [{...schemaType, path: arrayRootPath}, ...arraySchemaResults]
    }
    return arraySchemaResults
  }
  if (schemaType.jsonType === 'object') {
    const objectSchemaFields = schemaType.fields
    const objectRootPath = [...path]
    const objectSchemaResults = objectSchemaFields.reduce<
      CreateInternationalizedArrayFieldsResult[]
    >((acc, objectField) => {
      const objectSchemaField = objectField.type
      const fieldName = objectField.name
      const objectItemPath = [...objectRootPath, fieldName]
      const objectSchema = createInternationalizedArrayFields(
        objectSchemaField,
        objectItemPath
      )
      if (fieldName.startsWith('internationalizedArray')) {
        return [
          ...acc,
          {...objectSchemaField, path: objectItemPath, name: fieldName},
          ...objectSchema,
        ]
      }
      return [...acc, ...objectSchema]
    }, [])

    if (schemaType.name.startsWith('internationalizedArray')) {
      return [{...schemaType, path: objectRootPath}, ...objectSchemaResults]
    }
    return objectSchemaResults
  }

  if (schemaType.name.startsWith('internationalizedArray')) {
    return [{...schemaType, path: [...path, schemaType.name]}]
  }
  return []
}
