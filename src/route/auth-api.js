import express from "express";
import { authMiddleware } from "../middleware/auth-middleware.js";
import tailorController from "../controller/tailor-controller.js";
import modelController from "../controller/model-controller.js";
import productController from "../controller/product-controller.js";
import transferController from "../controller/transfer-controller.js";
import reportController from "../controller/report-controller.js";
import upload from "../utils/upload.js";

const authRouter = express.Router();

authRouter.use(authMiddleware);

authRouter.post("/tailors", tailorController.create);
authRouter.get("/tailors", tailorController.search);
authRouter.get("/tailors/:tailorId", tailorController.get);
authRouter.put("/tailors/:tailorId", tailorController.update);
authRouter.delete("/tailors/:tailorId", tailorController.remove);

authRouter.post("/models", modelController.create);
authRouter.get("/models", modelController.search);
authRouter.get("/models/:modelId", modelController.get);
authRouter.put("/models/:modelId", modelController.update);
authRouter.delete("/models/:modelId", modelController.remove);

authRouter.post("/products", upload, productController.create);
authRouter.get("/products", productController.search);
authRouter.get("/products/:productId", productController.get);
authRouter.put("/products/:productId", upload, productController.update);
authRouter.delete("/products/:productId", productController.remove);

authRouter.post("/transfers", transferController.create);
authRouter.get("/transfers/:productCode", transferController.get);

authRouter.get("/reports/stock-card", reportController.stockCard);
authRouter.get("/reports/inventory-stock", reportController.inventoryStock);
authRouter.get("/reports/dashboard", reportController.dashboard);
authRouter.get("/reports/products", reportController.products);

export { authRouter };
