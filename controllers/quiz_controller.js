const Quiz = require('../models/quiz');
const genAI = require('../config/OpenAI');

// Use only once — globally defined model
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generate_quiz(req, res) {
    try {
        const { courseId, subjectId, semesterId, subjectName, difficultyLevel } = req.body;

        // Validation
        if (!courseId || !subjectId || !semesterId || !subjectName || !difficultyLevel) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        const numQuestions = 20;

        // Prompt for Gemini
        const prompt = `
        Generate ${numQuestions} multiple-choice questions for the subject "${subjectName}".
        Difficulty level: ${difficultyLevel}.
        Each question must include:
        - question text
        - exactly 4 options
        - 1 correct answer
        Return only valid JSON:
        [
          {
            "question": "What is ...?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "B"
          }
        ]
        `;

        // Use Gemini model
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();

        // Debug log to see what AI returns
        console.log(" Gemini Raw Output:", rawText);

        let quizData;

        try {
            quizData = JSON.parse(rawText);
        } catch (error) {
            const jsonMatch = rawText.match(/\[.*\]/s);
            if (jsonMatch) {
                quizData = JSON.parse(jsonMatch[0]);
            } else {
                console.error("❌ Could not parse Gemini response:", rawText);
                return res.status(500).json({
                    message: "AI returned invalid data. Try again.",
                    rawOutput: rawText
                });
            }
        }


        // Save in DB
        const newQuiz = new Quiz({
            courseId,
            semesterId,
            subjectId,
            difficultyLevel,
            questions: quizData
        });

        await newQuiz.save();

        res.status(201).json({
            message: "Quiz generated successfully",
            quiz: newQuiz,
        });

    } catch (error) {
        console.error("Quiz Generation Error:", error);
        res.status(500).json({
            message: "Failed to generate quiz",
            error: error.message
        });
    }
}

// Fetch quiz API
async function get_quiz(req, res) {
    try {
        const { courseId, semesterId, subjectId, difficultyLevel } = req.query;
        const filters = {};
        if (courseId) filters.courseId = courseId;
        if (semesterId) filters.semesterId = semesterId;
        if (subjectId) filters.subjectId = subjectId;
        if (difficultyLevel) filters.difficultyLevel = difficultyLevel;

        const quiz = await Quiz.findOne(filters);
        if (!quiz) {
            return res.status(404).json({ message: "No quiz found for selected filters" });
        }

        res.json(quiz);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching quiz",
            error: error.message
        });
    }
};

module.exports = {
    generate_quiz,
    get_quiz
};
