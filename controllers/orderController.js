const Order = require('../models/Order')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Razorpay = require('razorpay')
const crypto = require('crypto')

// Razorpay instance banao
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Step 1 — Razorpay order banao
const createRazorpayOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body

    // Cart lo
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price image stock')

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    // Stock check karo sabhi items ka
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `${item.product.name} ka stock available nahi hai`
        })
      }
    }

    // Total calculate karo
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    // Razorpay order banao
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Razorpay paisa paise mein leta hai
      currency: 'INR',
      receipt: `order_${Date.now()}`
    })

    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Step 2 — Payment verify karo aur order save karo
const verifyPaymentAndSaveOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress
    } = req.body

    // Signature verify karo — payment genuine hai kya
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' })
    }

    // Cart lo
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price image stock')

    // Total calculate karo
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    // Order items banao — product ki details copy karo
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      quantity: item.quantity
    }))

    // Order save karo
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentInfo: {
        razorpay_order_id,
        razorpay_payment_id,
        status: 'paid'
      },
      orderStatus: 'processing'
    })

    // Stock kam karo
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      )
    }

    // Cart clear karo
    await Cart.findOneAndDelete({ user: req.user.id })

    res.status(201).json({
      message: 'Order placed successfully',
      order
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Apne orders dekho
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })

    res.status(200).json(orders)

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Ek order dekho
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check karo yeh order is user ka hai
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    res.status(200).json(order)

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentAndSaveOrder,
  getMyOrders,
  getOrder
}