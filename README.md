# sanity-plugin-internationalized-array

A helper function that renders a custom input component for writing localised fields of content into an array.

**This an early proof-of-concept and should not yet be used without thorough testing**

Add an array to your schema by importing the helper function.

```js
// ./src/schema/person.js
export default {
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    // ...all your other fields
    internationalizedArray({
      name: 'greeting' // required
      type: 'string' // required: string | text | number | boolean
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ] // required, must be an array of objects
      showNativeInput: false // optional: just for debugging
    })
  ]
}
```

This will create an Array field where `string` fields can be added with the name `title`. The custom input contains buttons which will add new array items with the language as the `_key` value. Data returned from this array will look like this:

```json
"greeting": [
  { "_key": "en", "value": "hello" },
  { "_key": "fr", "value": "bonjour" },
]
```

Using GROQ filters you can query for a specific language key like so:

```json
*[_type == "person"]{
  "greeting": greeting[_key == "en"][0].value
}
```

### Why store localised field data like this?

The most popular way to store translated content is in an object using the method prescribed in [@sanity/language-filter](https://www.npmjs.com/package/@sanity/language-filter). This works well and creates tidy object structures, but also create a unique field path for every unique field name, multiplied by the number of languages in your dataset.

For most people, this won't become an issue. On a very large dataset with a lot of languages, the [Attribute Limit](https://www.sanity.io/docs/attribute-limit) can become a concern.

An object with the same content as above would look like this:

```json
"greeting" {
  "en": "hello",
  "fr": "bonjour"
}
```

This creates three unique query paths. The array created by this plugin creates four.

However, every language added to the object increases the number of attributes. Where the array method is limited only by the amount of data you can store in your dataset (heaps!).

## License

MIT © Simeon Griggs
See LICENSE
