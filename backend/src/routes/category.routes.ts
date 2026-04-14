import { Router } from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from "../controllers/category.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router: Router = Router();

router.post("/category", upload.single("icon"), createCategory);
router.get("/categories", getCategories);
router.get("/category/:id", getCategoryById);
router.put("/category/:id", updateCategory);
router.delete("/category/:id", deleteCategory);

export default router; 