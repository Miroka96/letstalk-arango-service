'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Question = require('../models/question');

const questions = module.context.collection('questions');
const hasQuestion = module.context.collection('hasQuestion');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the question');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('question');


router
    .get(p.restrict(p.p.view_questions), function (req, res) {
        res.send(questions.all());
    }, 'list')
    .response([Question.View], 'A list of questions.')
    .summary('List all questions')
    .description(dd`
  Retrieves a list of all questions.
`);

router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const questionId = `${questions.name()}/${key}`;
        if (!p.has(req.user, p.p.view_question, questionId)) res.throw(403, 'Not authorized');
        let question;
        try {
            question = questions.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send(question);
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Question.View, 'The question.')
    .summary('Fetch a question')
    .description(dd`
  Retrieves a question by its key.
`);


router
    .put(':key', function (req, res) {
        const key = req.pathParams.key;
        const questionId = `${questions.name()}/${key}`;
        if (!p.has(req.user, p.p.change_question, questionId)) res.throw(403, 'Not authorized');
        const question = req.body;
        let meta;
        try {
            meta = questions.replace(key, question);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(question, meta);
        res.send(question);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(Question.Write, 'The data to replace the question with.')
    .response(Question.View, 'The new question.')
    .summary('Replace a question')
    .description(dd`
  Replaces an existing question with the request body and
  returns the new document.
`);


router
    .patch(':key', function (req, res) {
        const key = req.pathParams.key;
        const questionId = `${questions.name()}/${key}`;
        if (!p.has(req.user, p.p.change_question, questionId)) res.throw(403, 'Not authorized');
        const patchData = req.body;
        let question;
        try {
            questions.update(key, patchData);
            question = questions.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(question);
    }, 'update')
    .pathParam('key', keySchema)
    .body(Question.Patch, 'The data to update the question with.')
    .response(Question.View, 'The updated question.')
    .summary('Update a question')
    .description(dd`
  Patches a question with the request body and
  returns the updated document.
`);


router
    .delete(':key', function (req, res) {
        const key = req.pathParams.key;
        const questionId = `${questions.name()}/${key}`;
        if (!p.has(req.user, p.p.delete_question, questionId)) res.throw(403, 'Not authorized');
        try {
            questions.remove(key);
            for (const has of hasQuestion.inEdges(questionId)) {
                hasQuestion.remove(has);
            }
            p.deleteAll(questionId)
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
    .summary('Remove a question')
    .description(dd`
  Deletes a question from the database.
`);

router.use(require('./questions_answers'));
