'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Topic = require('../models/topic');

const topics = module.context.collection('topics');
const hasTopic = module.context.collection('hasTopic');
const keySchema = joi.string().required()
    .description('The key of the topic');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('topic');


router
    .get(p.restrict(p.p.view_topics), function (req, res) {
        res.send(topics.all());
    }, 'list')
    .response([Topic.View], 'A list of topics.')
    .summary('List all topics')
    .description(dd`
  Retrieves a list of all topics.
`);

router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const topicId = `${topics.name()}/${key}`;
        if (!p.has(req.user, p.p.view_topic, topicId)) res.throw(403, 'Not authorized');
        let topic;
        try {
            topic = topics.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send(topic);
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Topic.View, 'The topic.')
    .summary('Fetch a topic')
    .description(dd`
  Retrieves a topic by its key.
`);

router
    .put(':key', function (req, res) {
        const key = req.pathParams.key;
        const topicId = `${topics.name()}/${key}`;
        if (!p.has(req.user, p.p.change_topic, topicId)) res.throw(403, 'Not authorized');
        const topic = req.body;
        let meta;
        try {
            meta = topics.replace(key, topic);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(topic, meta);
        res.send(topic);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(Topic.Write, 'The data to replace the topic with.')
    .response(Topic.View, 'The new topic.')
    .summary('Replace a topic')
    .description(dd`
  Replaces an existing topic with the request body and
  returns the new document.
`);


router
    .patch(':key', function (req, res) {
        const key = req.pathParams.key;
        const topicId = `${topics.name()}/${key}`;
        if (!p.has(req.user, p.p.change_topic, topicId)) res.throw(403, 'Not authorized');
        const patchData = req.body;
        let topic;
        try {
            topics.update(key, patchData);
            topic = topics.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(topic);
    }, 'update')
    .pathParam('key', keySchema)
    .body(Topic.Patch, 'The data to update the topic with.')
    .response(Topic.View, 'The updated topic.')
    .summary('Update a topic')
    .description(dd`
  Patches a topic with the request body and
  returns the updated document.
`);


router
    .delete(':key', function (req, res) {
        const key = req.pathParams.key;
        const topicId = `${topics.name()}/${key}`;
        if (!p.has(req.user, p.p.delete_topic, topicId)) res.throw(403, 'Not authorized');
        try {
            topics.remove(key);
            for (const has of hasTopic.inEdges(id)) {
                hasTopic.remove(has);
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
    .summary('Remove a topic')
    .description(dd`
  Deletes a topic from the database.
`);
