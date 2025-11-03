const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Types.ObjectId,
        ref: 'Course',
        required: true

    },
    semesterId: {
        type: mongoose.Types.ObjectId,
        ref: 'Semester',
        required: true

    },
    subjectId: {

        type: mongoose.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    difficultyLevel: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    questions: [
        {
            question: { type: String, required: true },
            options: [String],
            correctAnswer: { type: String, required: true }
        }
    ],


},{
    timestamps:true
},);

module.exports = mongoose.model('Quiz', quizSchema);