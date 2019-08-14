"use strict";
const dd = require('dedent');

const keySchema = require('../util/patterns')._key.required().description('The key of the question');

const status = require('statuses');
const HTTP_CONFLICT = status('conflict');

const createRouter = require('@arangodb/foxx/router');

const router = createRouter();
module.exports = router;

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const questions = module.context.collection('questions');
const Answer = require('../models/answer');
const answers = module.context.collection('answers');
const hasAnswer = module.context.collection('hasAnswer');
const answered = module.context.collection('answered');
const p = require('../util/perm');

router
    .get(':key/answers', function (req, res) {
        const key = req.pathParams.key;
        const questionId = `${questions.name()}/${key}`;
        if (!p.has(req.user, p.p.view_answers, questionId)) res.throw(403, 'Not authorized');
        const questionAnswers = db._query(aql`FOR answer IN OUTBOUND ${questionId} ${hasAnswer} RETURN answer`);
        res.send(questionAnswers);
    }, 'list')
    .pathParam('key', keySchema)
    .response([Answer.View], 'A list of answers.')
    .summary('List all answers of the path question')
    .description(dd`
  Retrieves a list of all answers of the question specified in the path.
`);

router
    .post(':key/answers', function (req, res) {
        const key = req.pathParams.key;
        const questionId = `${questions.name()}/${key}`;
        if (!p.has(req.user, p.p.add_answer, questionId)) res.throw(403, 'Not authorized');

        const answer = req.body;
        let meta;
        try {
            meta = answers.save(answer);
            hasAnswer.save({_from: questionId, _to: meta._id});
            answered.save({_from: req.user._id, _to: meta._id});
            p.grant(req.user, meta, [p.p.change_answer, p.p.delete_answer]);
        } catch (e) {
            throw e;
        }
        Object.assign(answer, meta);
        res.status(201);
        res.set('location', req.makeAbsolute(
            req.reverse('detail', {key: answer._key})
        ));
        res.send(answer);
    }, 'create')
    .pathParam('key', keySchema)
    .body(Answer.Write, 'The answer to create.')
    .response(201, Answer.View, 'The created answer.')
    .error(HTTP_CONFLICT, 'The answer already exists.')
    .summary('Create a new answer for the path question')
    .description(dd`
  Creates a new answer from the request body and
  returns the saved document.
`);
