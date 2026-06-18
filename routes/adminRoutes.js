const express = require('express')
const router = express.Router()
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats
} = require('../controllers/adminController')
const { protect, adminOnly } = require('../middleware/authMiddleware')
const { upload } = require('../config/cloudinary')

// Sabhi admin routes protected hain
router.use(protect)
router.use(adminOnly)

router.get('/dashboard', getDashboardStats)
router.post('/products', upload.single('image'), createProduct)
router.put('/products/:id', upload.single('image'), updateProduct)
router.delete('/products/:id', deleteProduct)
router.get('/orders', getAllOrders)
router.put('/orders/:id', updateOrderStatus)

module.exports = router