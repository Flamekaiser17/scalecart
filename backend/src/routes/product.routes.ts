import { Router } from "express";
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCategory
} from "../controllers/product.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router: Router = Router();

// Use multer for file upload parsing
router.post("/", upload.array("images", 10), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);



export default router; 