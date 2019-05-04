var mongoose = require("mongoose");

var ideaSchema = new mongoose.Schema({
    name: String,
    description: String,
    user: String,
    imagePath: String,
    date: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});
module.exports = mongoose.model("Idea", ideaSchema);
