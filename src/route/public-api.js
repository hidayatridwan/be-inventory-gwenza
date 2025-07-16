import express from "express";
import userController from "../controller/user-controller.js";

const publicRouter = express.Router();

publicRouter.get("/api/health-check", (req, res) => {
  res.status(200).send({ message: "Healthy" });
});
publicRouter.post("/api/users", userController.register);
publicRouter.post("/api/users/login", userController.login);

export { publicRouter };
