const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

const app = express()

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1") || (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const profileRouter = require("./routes/profile.routes")
const shareRouter = require("./routes/share.routes")
const adminRouter = require("./routes/admin.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/profile", profileRouter)
app.use("/api/share", shareRouter)
app.use("/api/admin", adminRouter)

/* Serve Frontend in Production/Docker (only if dist folder exists) */
const frontendDistPath = path.join(__dirname, "../../Frontend/dist")
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath))
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"))
    })
}

module.exports = app