const express = require('express')
const { createProduct, getProducts, getSingleProduct, deleteProduct, updateProduct } = require('../controllers/productController')
const protect = require('../middleware/authMiddleware')
const { upload } = require('../utils/fileUpload')
const router = express.Router()

router.post('/', protect, upload.single('image'), createProduct)
router.get('/', protect, getProducts)
router.get('/:id', protect, getSingleProduct)
router.patch('/:id', protect, upload.single('image'), updateProduct)
router.delete('/:id', protect, deleteProduct)

module.exports = router