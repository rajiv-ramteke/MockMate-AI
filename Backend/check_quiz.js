const mongoose = require("mongoose");
const InterviewReport = require("./src/models/interviewReport.model.js");
require("dotenv").config();

async function check() {
    try {
        await mongoose.connect("mongodb+srv://Rajiv:%40nshu%231722@cluster0.dlgqook.mongodb.net/InterviewGenius?appName=Cluster0");
        // Get the latest one
        const latest = await InterviewReport.findOne().sort({ createdAt: -1 });
        
        // Let's use lean() to see exactly what's in the DB document
        const rawDoc = await InterviewReport.findOne({ _id: latest._id }).lean();
        console.log(JSON.stringify(rawDoc, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
check();
