# sanity-plugin-internationalized-array

> NOTE This is for the Studio v2 version of the plugin
>
> There is a [Studio v3 specific version in the studio-v3 branch](https://github.com/SimeonGriggs/sanity-plugin-internationalized-array/tree/studio-v3)

A helper function that renders a custom input component for writing localized fields of content into an array.

![2022-07-13 12 53 29](https://user-images.githubusercontent.com/9684022/178729823-cbb1059f-4ae0-4ab0-900d-4f22b030c1d1.gif)

## Installation

```
sanity install internationalized-array
```

Add an array to your schema by importing the helper function.

```js
import { internationalizedArray } from "sanity-plugin-internationalized-array";

// ./src/schema/person.js
export default {
  name: "person",
  title: "Person",
  type: "document",
  fields: [
    // ...all your other fields
    internationalizedArray({
      // Required, the `name` of the outer array
      name: "greeting",
      // Required, the `type` of the inner field
      // One of: string | text | number | boolean
      type: "string",
      // Required, must be an array of objects
      languages: [
        { id: "en", title: "English" },
        { id: "fr", title: "French" },
      ],
      // Optional: just for debugging
      showNativeInput: false,
    }),
  ],
};
```

This will create an Array field where `string` fields can be added with the name `title`. The custom input contains buttons which will add new array items with the language as the `_key` value. Data returned from this array will look like this:

```json
"greeting": [
  { "_key": "en", "value": "hello" },
  { "_key": "fr", "value": "bonjour" },
]
```

Using GROQ filters you can query for a specific language key like so:

```js
*[_type == "person"] {
  "greeting": greeting[_key == "en"][0].value
}
```

## Migrate from objects to arrays

[See the migration script](https://github.com/SimeonGriggs/sanity-plugin-internationalized-array/blob/main/migrations/transformObjectToArray.js) inside `./migrations/transformObjectToArray.js` of this Repo.

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

## License

MIT © Simeon Griggs
See LICENSE
