'use strict';
const db = require('@arangodb').db;
const collections = [
  "users",
  "facts",
  "topics",
  "pictures",
  "locations",
  "questions",
  "answers"
];

for (const localName of collections) {
  const qualifiedName = module.context.collectionName(localName);
  db._drop(qualifiedName);
}
