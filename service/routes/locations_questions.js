"use strict";
const dd = require('dedent');

const keySchema = require('../util/patterns')._key.required().description('The key of the location');

const status = require('statuses');
const HTTP_CONFLICT = status('conflict');

const createRouter = require('@arangodb/foxx/router');

const router = createRouter();
module.exports = router;

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const locations = module.context.collection('locations');
const Question = require('../models/question');
const questions = module.context.collection('questions');
const hasQuestion = module.context.collection('hasQuestion');
const p = require('../util/perm');

router
    .get(':key/questions', function (req, res) {
        const key = req.pathParams.key;
        const locationId = `${locations.name()}/${key}`;
        if (!p.has(req.user, p.p.view_questions, locationId)) res.throw(403, 'Not authorized');
        const locationQuestions = db._query(aql`FOR question IN OUTBOUND ${locationId} ${hasQuestion} RETURN question`);
        res.send(locationQuestions);
    }, 'list')
    .pathParam('key', keySchema)
    .response([Question.View], 'A list of questions.')
    .summary('List all questions of the path location')
    .description(dd`
  Retrieves a list of all questions of the location specified in the path.
`);

router
    .post(':key/questions', function (req, res) {
        const key = req.pathParams.key;
        const locationId = `${locations.name()}/${key}`;
        if (!p.has(req.user, p.p.add_question, locationId)) res.throw(403, 'Not authorized');

        const question = req.body;
        let meta;
        try {
            meta = questions.save(question);
            hasQuestion.save({_from: locationId, _to: meta._id});
            p.grant(req.user, meta, [p.p.change_question, p.p.delete_question]);
        } catch (e) {
            throw e;
        }
        Object.assign(question, meta);
        res.status(201);
        res.set('location', req.makeAbsolute(
            req.reverse('detail', {key: question._key})
        ));
        res.send(question);
    }, 'create')
    .pathParam('key', keySchema)
    .body(Question.Write, 'The question to create.')
    .response(201, Question.View, 'The created question.')
    .error(HTTP_CONFLICT, 'The question already exists.')
    .summary('Create a new question for the path location')
    .description(dd`
  Creates a new question from the request body and
  returns the saved document.
`);
