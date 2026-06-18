const express = require('express')
const router = express.Router()
const {
  createRazorpayOrder,
  verifyPaymentAndSaveOrder,
  getMyOrders,
  getOrder
} = require('../controllers/orderController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.post('/create-razorpay-order', createRazorpayOrder)
router.post('/verify-payment', verifyPaymentAndSaveOrder)
router.get('/my-orders', getMyOrders)
router.get('/:id', getOrder)

module.exports = router