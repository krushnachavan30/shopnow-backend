const Product = require('../models/Product')
const Order = require('../models/Order')
const User = require('../models/User')

// Product banao
const createProduct = async (req, res) => {
  try {
    // console.log('Body:', req.body)    // Debug ke liye
    // console.log('File:', req.file)    // Debug ke liye

    const { name, description, price, category, stock } = req.body

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({ message: 'Sabhi fields required hain' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image required' })
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),      // String se Number banao
      category,
      stock: Number(stock),      // String se Number banao
      image: req.file.path
    })

    res.status(201).json({ message: 'Product created', product })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Product update karo
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body

    // Update data
    let updateData = { name, description, price, category, stock }

    // Agar nayi image upload ki toh update karo
    if (req.file) {
      updateData.image = req.file.path
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json({ message: 'Product updated', product })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Product delete karo
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Cloudinary se image bhi delete karo
    const imageUrl = product.image
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0]
    await cloudinary.uploader.destroy(publicId)

    await Product.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: 'Product deleted' })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Sabhi orders dekho — admin ke liye
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json(orders)

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Order status update karo
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    )

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.status(200).json({ message: 'Order status updated', order })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments()
    const totalOrders = await Order.countDocuments()
    const totalUsers = await User.countDocuments()

    const revenue = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])

    res.status(200).json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: revenue[0]?.total || 0
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const { cloudinary } = require('../config/cloudinary')

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats
}