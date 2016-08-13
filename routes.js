const express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Question = require("./models.js");

router.param("qID", (request, response, next, qID) => {
    Question.findById(qID).exec().then((question) => { //Query#exec returns a promise
        if (!question) {
            error = new Error("Not Found");
            error.status = 404;
            throw error;
        }
        request.question = question;
        return next();
    }).catch(next); //Promise#catch always gets errors, so send it next() to pass it along to the error handlers; see app.js:35
});

router.param("aID", (request, response, next, aID) => {
    request.answer = request.question.answers.id(aID);
    if (!request.answer) {
        error = new Error("Error creating question");
        error.status = 500;
        throw error;
    }
    return next();
});

router.get('/', (request, response, next) => {
    //show all questions
    Question.find({}).sort({
        createdAt: -1
    }).exec().then((questions) => {
        response.json(questions);
    }).catch(next);
});

router.post('/', (request, response, next) => {
    //create new question
    new Question(request.body).save().then((newQuestion) => {
        response.status(201);
        response.json(newQuestion);
    }).catch(next);
});

router.get('/:qID', (request, response) => {
    //show question:id
    response.json(request.question);
});

router.post('/:qID/answers', (request, response, next) => {
    //create new answer
    request.question.answers.push(request.body);
    request.question.save().then((question) => {
        response.status(201);
        response.json(question);
    }).catch(next);
});

router.put('/:qID/answers/:aID', (request, response, next) => {
    if (!request.body) {
        error = new Error("Error creating answer");
        error.status = 500;
        throw error;
    }
    request.answer.update(request.body).then(result => {
        response.json(result);
    }).catch(next);
});

router.delete('/:qID/answers/:aID', (request, response, next) => {
    request.answer.remove().then(result => {
        return request.question.save();
    }).then(question => {
        response.json(question);
    }).catch(next);
});
router.patch('/:qID/answers/:aID/vote-:dir', (request, response, next) => {
    //I use PATCH to partially modify existing resource
    if (!request.params.dir.match(/^(up|down)$/i)) {
        var err = new Error("Not Found");
        err.status = 404;
        return next(err);
    } else {
        request.vote = request.params.dir;
        next();
    }
}, (request, response, next) => {
    request.answer.vote(request.vote).then(question => {
        response.json(question);
    }).catch(next);
});

module.exports = router;
