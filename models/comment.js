var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    user: {
        id: {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        },
        username: String
    },
    date: String
});

module.exports = mongoose.model("Comment", commentSchema);