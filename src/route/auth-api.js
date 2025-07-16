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

authRouter.post("/api/tailors", tailorController.create);
authRouter.get("/api/tailors", tailorController.search);
authRouter.get("/api/tailors/:tailorId", tailorController.get);
authRouter.put("/api/tailors/:tailorId", tailorController.update);
authRouter.delete("/api/tailors/:tailorId", tailorController.remove);

authRouter.post("/api/models", modelController.create);
authRouter.get("/api/models", modelController.search);
authRouter.get("/api/models/:modelId", modelController.get);
authRouter.put("/api/models/:modelId", modelController.update);
authRouter.delete("/api/models/:modelId", modelController.remove);

authRouter.post("/api/products", upload, productController.create);
authRouter.get("/api/products", productController.search);
authRouter.get("/api/products/:productId", productController.get);
authRouter.put("/api/products/:productId", upload, productController.update);
authRouter.delete("/api/products/:productId", productController.remove);

authRouter.post("/api/transfers", transferController.create);
authRouter.get("/api/transfers/:productCode", transferController.get);

authRouter.get("/api/reports/stock-card", reportController.stockCard);
authRouter.get("/api/reports/inventory-stock", reportController.inventoryStock);
authRouter.get("/api/reports/dashboard", reportController.dashboard);
authRouter.get("/api/reports/products", reportController.products);

export { authRouter };
