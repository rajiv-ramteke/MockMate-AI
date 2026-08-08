const mongoose = require("mongoose");
const InterviewReport = require("./Backend/src/models/interviewReport.model.js");

async function check() {
    try {
        await mongoose.connect("mongodb+srv://Rajiv:%40nshu%231722@cluster0.dlgqook.mongodb.net/InterviewGenius?appName=Cluster0");
        const latest = await InterviewReport.findOne().sort({ createdAt: -1 });
        console.log("Latest Report Title:", latest.title);
        console.log("Technical Quiz Length:", latest.technicalQuiz.length);
        console.log("Technical Quiz Data:", JSON.stringify(latest.technicalQuiz, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
check();
