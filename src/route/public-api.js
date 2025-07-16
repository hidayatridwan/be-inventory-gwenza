import express from "express";
import userController from "../controller/user-controller.js";

const publicRouter = express.Router();

publicRouter.get("/health-check", (req, res) => {
  res.status(200).send({ message: "Healthy" });
});
publicRouter.post("/users", userController.register);
publicRouter.post("/users/login", userController.login);

export { publicRouter };
