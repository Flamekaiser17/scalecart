import { Router } from "express";
import { upload } from '../middlewares/multer.middlewares.js';
import {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    searchBrands,
    getBrandsByCategory
} from '../controllers/brand.controllers.js';

const router: Router = Router();

router.post('/brand', upload.single('logo'), createBrand);
router.get('/brands', getBrands);
router.get('/brand/:id', getBrandById);
router.put('/brand/:id', updateBrand);
router.delete('/brand/:id', deleteBrand);
router.get('/brands/search', searchBrands);
router.get('/brands/by-category', getBrandsByCategory);

export default router; 