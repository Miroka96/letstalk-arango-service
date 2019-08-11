'use strict';

module.context.use('/users', require('./routes/users'), 'users');
module.context.use('/facts', require('./routes/facts'), 'facts');
module.context.use('/topics', require('./routes/topics'), 'topics');
module.context.use('/locations', require('./routes/locations'), 'locations');
module.context.use('/questions', require('./routes/questions'), 'questions');
module.context.use('/pictures', require('./routes/pictures'), 'pictures');
module.context.use('/answers', require('./routes/answers'), 'answers');
module.context.use('/auth', require('./routes/auth'), 'authentication');

// provide session handling for all routes
const sessionsMiddleware = require('@arangodb/foxx/sessions');
const sessions = sessionsMiddleware({
    storage: module.context.collection('sessions'),
    transport: 'cookie'
});
module.context.use(sessions);


// provide user access for all routes
const users = module.context.collection('users');
module.context.use(function (req, res, next) {
    if (req.session.uid) {
        try {
            req.user = users.document(req.session.uid)
        } catch (e) {
            req.session.uid = null;
            req.sessionStorage.save();
        }
    }
    next();
});
