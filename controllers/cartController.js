const Cart = require('../models/Cart')
const Product = require('../models/Product')

// Cart dekho
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price image stock')

    if (!cart) {
      return res.status(200).json({ items: [], total: 0 })
    }

    // Total calculate karo
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    res.status(200).json({ items: cart.items, total })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Cart mein product add karo
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body

    // Product exist karta hai kya
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Stock available hai kya
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' })
    }

    // Cart dhundo ya naya banao
    let cart = await Cart.findOne({ user: req.user.id })

    if (!cart) {
      // Pehli baar cart banao
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }]
      })
    } else {
      // Cart already hai — product already hai kya
      const existingItem = cart.items.find(
        item => item.product.toString() === productId
      )

      if (existingItem) {
        // Product already hai — quantity badao
        existingItem.quantity += quantity
      } else {
        // Naya product add karo
        cart.items.push({ product: productId, quantity })
      }

      await cart.save()
    }

    // Populate karke bhejo
    await cart.populate('items.product', 'name price image stock')

    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    res.status(200).json({ message: 'Added to cart', items: cart.items, total })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Quantity update karo
const updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' })
    }

    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    // Item dhundo
    const item = cart.items.find(
      item => item.product.toString() === productId
    )

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' })
    }

    // Stock check karo
    const product = await Product.findById(productId)
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' })
    }

    item.quantity = quantity
    await cart.save()

    await cart.populate('items.product', 'name price image stock')

    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    res.status(200).json({ items: cart.items, total })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Cart se item remove karo
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params

    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    // Item filter out karo
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    )

    await cart.save()

    await cart.populate('items.product', 'name price image stock')

    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    res.status(200).json({ message: 'Item removed', items: cart.items, total })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Cart clear karo — order ke baad
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id })
    res.status(200).json({ message: 'Cart cleared' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getCart, addToCart, updateQuantity, removeFromCart, clearCart }