var mongoose = require("mongoose");

var ideaSchema = new mongoose.Schema({
    name: String,
    description: String,
    imagePath: String,
    date: String,
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [
        {
            user: {
                id: {
                    type: mongoose.Schema.ObjectId,
                    ref: "User"
                }
            }
        }
    ]
});
module.exports = mongoose.model("Idea", ideaSchema);
