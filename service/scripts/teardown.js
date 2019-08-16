'use strict';
const db = require('@arangodb').db;
const collections = [
    "users",
    "facts",
    "topics",
    "locations",
    "questions",
    "pictures",
    "answers",
    "sessions",
    "groups",
    "hasFact",
    "hasTopic",
    "memberOf",
    "hasQuestion",
    "hasPicture",
    "hasAnswer",
    "answered",
    "hasPermission"
];

for (const localName of collections) {
    const qualifiedName = module.context.collectionName(localName);
    db._drop(qualifiedName);
}
