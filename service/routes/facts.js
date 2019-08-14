'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Fact = require('../models/fact');

const facts = module.context.collection('facts');
const hasFact = module.context.collection('hasFact');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the fact');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('fact');


router
    .get(p.restrict(p.p.view_facts), function (req, res) {
        res.send(facts.all());
    }, 'list')
    .response([Fact.View], 'A list of facts.')
    .summary('List all facts')
    .description(dd`
  Retrieves a list of all facts.
`);

router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const factId = `${facts.name()}/${key}`;
        if (!p.has(req.user, p.p.view_fact, factId)) res.throw(403, 'Not authorized');
        let fact;
        try {
            fact = facts.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send(fact);
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Fact.View, 'The fact.')
    .summary('Fetch a fact')
    .description(dd`
  Retrieves a fact by its key.
`);

router
    .put(':key', function (req, res) {
        const key = req.pathParams.key;
        const factId = `${facts.name()}/${key}`;
        if (!p.has(req.user, p.p.change_fact, factId)) res.throw(403, 'Not authorized');
        const fact = req.body;
        let meta;
        try {
            meta = facts.replace(key, fact);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(fact, meta);
        res.send(fact);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(Fact.Write, 'The data to replace the fact with.')
    .response(Fact.View, 'The new fact.')
    .summary('Replace a fact')
    .description(dd`
  Replaces an existing fact with the request body and
  returns the new document.
`);


router
    .patch(':key', function (req, res) {
        const key = req.pathParams.key;
        const factId = `${facts.name()}/${key}`;
        if (!p.has(req.user, p.p.change_fact, factId)) res.throw(403, 'Not authorized');
        const patchData = req.body;
        let fact;
        try {
            facts.update(key, patchData);
            fact = facts.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(fact);
    }, 'update')
    .pathParam('key', keySchema)
    .body(Fact.Patch, 'The data to update the fact with.')
    .response(Fact.View, 'The updated fact.')
    .summary('Update a fact')
    .description(dd`
  Patches a fact with the request body and
  returns the updated document.
`);


router
    .delete(':key', function (req, res) {
        const key = req.pathParams.key;
        const id = `${facts.name()}/${key}`;
        if (!p.has(req.user, p.p.delete_fact, id)) res.throw(403, 'Not authorized');
        try {
            facts.remove(key);
            for (const has of hasFact.inEdges(id)) {
                hasFact.remove(has);
            }
            p.deleteAll(id)
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send({success: true});
    }, 'delete')
    .pathParam('key', keySchema)
    .response(joi.object({success: true}), 'A success message - only true possible')
    .summary('Remove a fact')
    .description(dd`
  Deletes a fact from the database.
`);
