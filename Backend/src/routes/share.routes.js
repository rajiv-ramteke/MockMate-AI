const { Router } = require("express");
const { shareWithProfessor } = require("../controllers/share.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const shareRouter = Router();

shareRouter.post("/professor", authMiddleware.authUser, shareWithProfessor);

module.exports = shareRouter;
