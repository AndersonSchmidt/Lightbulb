var mongoose = require("mongoose");

var ideaSchema = new mongoose.Schema({
    name: String,
    description: String,
    imagePath: String,
    date: String,
    totalLikes: {type: Number, default: 0},
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
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
