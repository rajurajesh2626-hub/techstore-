const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    size: String
  }],
  totalAmount: { type: Number, required: true },
  paymentId: String,
  orderId: String,
  status: { type: String, default: 'pending' },
  address: {
    name: String,
    phone: String,
    street: String,
    city: String,
    pincode: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);