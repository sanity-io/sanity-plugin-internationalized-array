> This is the **Sanity Studio v3 version** of sanity-plugin-internationalized-array.
>
> For the v2 version, please refer to the [v2-branch](https://github.com/sanity-io/sanity-plugin-internationalized-array/tree/studio-v2).

# sanity-plugin-internationalized-array

A helper function that renders a custom input component for writing localized fields of content into an array.

![Screenshot of an internationalized input](./img/internationalized-array.png)

## Installation

```
npm install --save sanity-plugin-internationalized-array
```

or

```
yarn add sanity-plugin-internationalized-array
```

## Usage for simple field types

Add it as a plugin in sanity.config.ts (or .js):

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

 export const defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'}
      ],
      fieldTypes: ['string'],
    })
  ]
})
```

This will register two new fields to the schema, based on the settings passed into `fieldTypes`:

- `internationalizedArrayString` an array field of:
- `internationalizedArrayStringValue` an object field, with a single `string` field inside called `value`

You can pass in more registered schema-type names to generate more internationalized arrays. Use them in your schema like this:

```ts
defineField({
  name: 'greeting',
  type: 'internationalizedArrayString',
}),
```

## Loading languages

Languages must be an array of objects with an `id` and `title`.

```ts
languages: [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'}
],
```

Or an asynchronous function that returns an array of objects with an `id` and `title`.

```ts
languages: async () => {
  const response = await fetch('https://example.com/languages')
  return response.json()
}
```

The async function contains a configured Sanity Client in the first parameter, allowing you to store Language options as documents. Your query should return an array of objects with an `id` and `title`.

```ts
languages: async (client) => {
  const response = await client.fetch(`*[_type == "language"]{ id, title }`)
  return response
},
```

Additionally, you can "pick" fields from a document, to pass into the query. For example, if you have a concept of "Markets" where only certain language fields are required in certain markets.

In this example, each language document has an array of strings called `markets` to declare where that language can be used. And the document being authored has a single `market` field.

```ts
select: {
  market: 'market'
},
languages: async (client, {market = ``}) => {
  const response = await client.fetch(
    `*[_type == "language" && $market in markets]{ id, title }`,
    {market}
  )
  return response
},
```

## Using more complex field types

For more control over the `value` field, you can pass a schema definition into the `fieldTypes` array.

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

 export const defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'}
      ],
      fieldTypes: [
        defineField({
          name: 'featuredProduct',
          type: 'reference',
          to: [{type: 'product'}]
          hidden: (({document}) => !document?.title)
        })
      ],
    })
  ]
})
```

This would also create two new fields in your schema.

- `internationalizedArrayFeaturedProduct` an array field of:
- `internationalizedArrayFeaturedProductValue` an object field, with a single `string` field inside called `value`

Note that the `name` key in the field gets rewritten to `value` and is instead used to name the object field.

## Creating internationalized objects

Due to how fields are created, you cannot use anonymous objects in the `fieldTypes` array. You must register the object type in your Studio's schema as an "alias type".

```ts
// ./schemas/seoType.ts

import {defineField} from 'sanity'

export const seoType = defineField({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'description', type: 'string'}),
  ],
})
```

Then in your plugin configuration settings, add the name of your alias type to the `fieldTypes` setting.

```ts
internationalizedArray({
  languages: [
    //...languages
  ],
  fieldTypes: ['seo'],
})
```

Lastly, add the field to your schema.

```ts
// ./schemas/post.ts

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      type: 'internationalizedArraySeo',
    }),
  ],
})
```

## Shape of stored data

The custom input contains buttons which will add new array items with the language as the `_key` value. Data returned from this array will look like this:

```json
"greeting": [
  { "_key": "en", "value": "hello" },
  { "_key": "fr", "value": "bonjour" },
]
```

## Querying data

Using GROQ filters you can query for a specific language key like so:

```js
*[_type == "person"] {
  "greeting": greeting[_key == "en"][0].value
}
```

## Migrate from objects to arrays

[See the migration script](https://github.com/sanity-io/sanity-plugin-internationalized-array/blob/main/migrations/transformObjectToArray.js) inside `./migrations/transformObjectToArray.js` of this Repo.

Follow the instructions inside the script and set the `_type` and field name you wish to target.

Please take a backup first!

### Why store localized field data like this?

The most popular way to store field-level translated content is in an object using the method prescribed in [@sanity/language-filter](https://www.npmjs.com/package/@sanity/language-filter). This works well and creates tidy object structures, but also create a unique field path for every unique field name, multiplied by the number of languages in your dataset.

For most people, this won't become an issue. On a very large dataset with a lot of languages, the [Attribute Limit](https://www.sanity.io/docs/attribute-limit) can become a concern. This plugin's arrays will use less attributes than an object once you have more than three languages.

The same content as above, plus a third language, structed as an `object` of `string` fields looks like this:

```json
"greeting" {
  "en": "hello",
  "fr": "bonjour",
  "es": "hola"
}
```

Which creates four unique query paths, one for the object and one for each language.

```
greeting
greeting.en
greeting.fr
greeting.es
```

Every language you add to every object that uses this structure will add to the number of unique query paths.

The array created by this plugin creates four query paths by default, but is not effected by the number of languages:

```
greeting
greeting[]
greeting[]._key
greeting[].value
```

By using this plugin you can safely extend the number of languages without adding any additional query paths.

MIT © Simeon Griggs
See LICENSE

## License

MIT-licensed. See LICENSE.

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-internationalized-array/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

[MIT](LICENSE) © Simeon Griggs
