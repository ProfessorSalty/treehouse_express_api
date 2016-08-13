const mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const AnswerSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Answer must contain some text'],
        min: [20, 'Answer must be at least 20 characters long']
    },
    votes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

AnswerSchema.method({
    //**Do not** use arrow functions when you need 'this' to refer to the calling object
    "update": function updateAnswer(updates, callback) {
        Object.assign(this, updates, {
            updatedAt: new Date()
        });
        if (callback) {
            this.parent().save(callback);
        } else {
            return this.parent().save();
        }
    },
    "vote": function voteAnswer(vote, callback) {
        if (vote === "up") {
            this.votes++;
        } else if (vote === "down") {
            this.votes--;
        }
        if (callback) {
            this.parent().save(callback);
        } else {
            return this.parent().save(); //model#save returns a promise, so return this function call to send a promise out when called; see routes.js:84
        }
    }
});

const QuestionSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Question must contain some text'],
        min: [20, 'Question must be at least 20 characters long']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    answers: [AnswerSchema]
}).pre("save", function sanitizeInput(next) {

    next();
}).pre("save", function sortAnswers(next) { //no arrow function!
    if (this.answers) {
        //Prevent the server from pooping itself if the question has no answers
        this.answers.sort((a, b) => {
            return b.votes === a.votes ? b.updatedAt - a.updatedAt : b.votes - a.votes;
        });
    }
    next();
});

module.exports = mongoose.model("Question", QuestionSchema);
