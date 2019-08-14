'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Answer = require('../models/answer');

const answers = module.context.collection('answers');
const hasAnswer = module.context.collection('hasAnswer');
const answered = module.context.collection('answered');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the answer');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('answer');


router
    .get(p.restrict(p.p.view_answers), function (req, res) {
        res.send(answers.all());
    }, 'list')
    .response([Answer.View], 'A list of answers.')
    .summary('List all answers')
    .description(dd`
  Retrieves a list of all answers.
`);


router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const answerId = `${answers.name()}/${key}`;
        if (!p.has(req.user, p.p.view_answer, answerId)) res.throw(403, 'Not authorized');
        let answer;
        try {
            answer = answers.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send(answer);
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Answer.View, 'The answer.')
    .summary('Fetch a answer')
    .description(dd`
  Retrieves a answer by its key.
`);


router
    .put(':key', function (req, res) {
        const key = req.pathParams.key;
        const answerId = `${answers.name()}/${key}`;
        if (!p.has(req.user, p.p.change_answer, answerId)) res.throw(403, 'Not authorized');
        const answer = req.body;
        let meta;
        try {
            meta = answers.replace(key, answer);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(answer, meta);
        res.send(answer);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(Answer.Write, 'The data to replace the answer with.')
    .response(Answer.View, 'The new answer.')
    .summary('Replace a answer')
    .description(dd`
  Replaces an existing answer with the request body and
  returns the new document.
`);


router
    .patch(':key', function (req, res) {
        const key = req.pathParams.key;
        const answerId = `${answers.name()}/${key}`;
        if (!p.has(req.user, p.p.change_answer, answerId)) res.throw(403, 'Not authorized');
        const patchData = req.body;
        let answer;
        try {
            answers.update(key, patchData);
            answer = answers.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(answer);
    }, 'update')
    .pathParam('key', keySchema)
    .body(Answer.Patch, 'The data to update the answer with.')
    .response(Answer.View, 'The updated answer.')
    .summary('Update a answer')
    .description(dd`
  Patches a answer with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
    const key = req.pathParams.key;
    const answerId = `${answers.name()}/${key}`;
    if (!p.has(req.user, p.p.delete_answer, answerId)) res.throw(403, 'Not authorized');
    try {
        answers.remove(key);
        for (const has of hasAnswer.inEdges(answerId)) {
            hasAnswer.remove(has);
        }
        for (const has of answered.inEdges(answerId)) {
            answered.remove(has);
        }
        p.deleteAll(answerId)
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
    .summary('Remove a answer')
    .description(dd`
  Deletes a answer from the database.
`);
