import {SchemaType} from 'sanity'

export function createValueSchemaTypeName(schemaType: SchemaType): string {
  return `${schemaType.name}Value`
}
