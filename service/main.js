'use strict';

module.context.use('/users', require('./routes/users'), 'users');
module.context.use('/facts', require('./routes/facts'), 'facts');
module.context.use('/topics', require('./routes/topics'), 'topics');
module.context.use('/locations', require('./routes/locations'), 'locations');
module.context.use('/questions', require('./routes/questions'), 'questions');
module.context.use('/pictures', require('./routes/pictures'), 'pictures');
module.context.use('/answers', require('./routes/answers'), 'answers');
module.context.use('/sessions', require('./routes/sessions'), 'sessions');
