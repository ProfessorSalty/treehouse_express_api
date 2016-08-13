const express = require('express'),
    jsonParser = require('body-parser').json,
    app = express(),
    router = require('./routes.js'),
    logger = require('morgan'),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    sanitizer = require('express-sanitizer');

mongoose.Promise = global.Promise; //Use native promises instead of deprecated mpromise
mongoose.connect("mongodb://localhost:27017/qa")

const db = mongoose.connection;

db.on('error', (err) => {
    console.error("connection error:", err)
});

db.once('open', () => {
    console.log('db connection successful');
});

app.use((request, response, next) => {
    response.header({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
    });
    if (request.method === "OPTIONS") {
        response.header({
            "Access-Control-Allow-Methods": "PUT,POST,DELETE"
        });
        return response.status(200).json({});
    }
    next();
});

app.use(logger('dev'));
app.use(jsonParser());
app.use(sanitizer());
app.use((request, response, next) => {
    request.body.text = request.sanitize(request.body.text);
    next();
});
app.use('/questions', router);
app.use(errorRoute);
app.use(handleErrors);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

function errorRoute(request, response, next) {
    var error = new Error("Not Found");
    error.status = 404;
    next(error);
}

function handleErrors(error, request, response, next) {
    response.status(error.status || 500);
    response.json({
        error: {
            message: error.message
        }
    });
}
