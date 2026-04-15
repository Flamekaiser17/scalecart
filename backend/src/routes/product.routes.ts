import { Router } from "express";
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from "../controllers/product.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router: Router = Router();

// Products route (GET / handles search and category filters via query params)
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin / Upload routes
router.post("/", upload.array("images", 10), createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;