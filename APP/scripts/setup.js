'use strict';
const db = require('@arangodb').db;
const documentCollections = [
  "users",
  "facts",
  "topics",
  "pictures",
  "locations",
  "questions",
  "answers"
];

for (const localName of documentCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createDocumentCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}