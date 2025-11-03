const UserProgress = require("../models/user_progress");
const Quiz = require("../models/quiz");
const genAI = require("../config/OpenAI"); // Gemini AI config
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Save user quiz progress
 * Calculates score, generates AI feedback, and stores in DB
 */
async function saveProgress(req, res){
  try {
    const { userId, quizId, answers } = req.body;

    if (!userId || !quizId || !answers) {
      return res.status(400).json({
        message: "userId, quizId, and answers are required",
      });
    }

    // Fetch quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Calculate correct/wrong answers
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] && answers[index] === q.correctAnswer) correct++;
    });

    const totalQuestions = quiz.questions.length;
    const wrong = totalQuestions - correct;
    const percentage = (correct / totalQuestions) * 100;

    // Generate AI feedback (optional)
    const prompt = `
    A student scored ${percentage}% in the subject.
    Provide short motivational feedback and suggest improvements.
    Limit response to 2 lines.
    `;

    const result = await model.generateContent(prompt);
    const feedback = result.response.text() || "";

    // Save progress
    const progress = new UserProgress({
      userId,
      subjectId: quiz.subjectId,
      quizId,
      totalQuestions,
      correctAnswers: correct,
      wrongAnswers: wrong,
      percentage,
      performanceFeedback: feedback,
    });

    await progress.save();

    res.status(201).json({
      message: "Progress saved successfully",
      progress,
    });
  } catch (error) {
    console.error("Save Progress Error:", error);
    res.status(500).json({
      message: "Error saving progress",
      error: error.message,
    });
  }
};

/**
 * Get all progress for a specific user8 */
async function getUserProgress(req, res){
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ message: "userId is required" });

    const progressList = await UserProgress.find({ userId }).populate("quizId subjectId");

    res.status(200).json({
      message: "User progress fetched successfully",
      progress: progressList,
    });
  } catch (error) {
    console.error("Get Progress Error:", error);
    res.status(500).json({
      message: "Error fetching progress",
      error: error.message,
    });
  }
};

module.exports = {
    saveProgress,
    getUserProgress
}