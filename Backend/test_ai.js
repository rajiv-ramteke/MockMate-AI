require('dotenv').config()
const mongoose = require('mongoose')
const { generateInterviewReport } = require('./src/services/ai.service')
const interviewReportModel = require('./src/models/interviewReport.model')

async function testAI() {
    console.log("Starting AI generation & DB test...")
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to MongoDB")

        const result = await generateInterviewReport({
            resume: "Rajiv Ganesh Ramteke, Frontend Developer with 2 years of React experience.",
            selfDescription: "",
            jobDescription: "Looking for a React developer with Node.js knowledge."
        })
        console.log("AI Generation SUCCESS! Title:", result.title)

        // Try inserting into DB
        const doc = new interviewReportModel({
            user: new mongoose.Types.ObjectId(), // Fake user ID
            resume: "test resume",
            selfDescription: "test self",
            jobDescription: "test job",
            ...result
        })
        console.log("RAW QUIZ OUTPUT:", JSON.stringify(result.technicalQuiz, null, 2))

        await doc.validate()
        console.log("Database Validation SUCCESS!")
        
    } catch (err) {
        console.error("ERROR CAUGHT:")
        console.error(err.message)
    } finally {
        await mongoose.disconnect()
    }
}

testAI()
