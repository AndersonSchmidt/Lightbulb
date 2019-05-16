var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    date: String
});

module.exports = mongoose.model("Comment", commentSchema);