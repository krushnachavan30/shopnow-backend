const Product = require('../models/Product')
const { cloudinary, upload } = require('../config/cloudinary')

// Sabhi products lao
const getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query

    // Filter object banao
    let filter = {}

    // Category filter
    if (category) {
      filter.category = category
    }

    // Search filter
    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    // Sort options
    let sortOption = {}
    if (sort === 'price_low') sortOption = { price: 1 }
    else if (sort === 'price_high') sortOption = { price: -1 }
    else if (sort === 'newest') sortOption = { createdAt: -1 }

    const products = await Product.find(filter).sort(sortOption)

    res.status(200).json(products)

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Ek product dekho
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json(product)

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getProducts, getProduct, upload }