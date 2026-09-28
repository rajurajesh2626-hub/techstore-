const API_URL = 'https://techstore-zt4n.onrender.com/api';

// Load products on homepage
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    const container = document.getElementById('products');

    if (!products.length) {
      container.innerHTML = '<p>No products yet. Add some from admin panel!</p>';
      return;
    }

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/250x250?text=No+Image'">
        <div class="product-info">
          <h3>${p.name}</h3>
          <p style="font-size:14px;color:#666">${p.description.substring(0, 60)}...</p>
          <div class="price">₹${p.price}</div>
          <button class="btn" onclick="addToCart('${p._id}')">Add to Cart</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('products').innerHTML = '<p>❌ Error loading products. Backend running-a?</p>';
  }
}

// Cart functions (LocalStorage)
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

async function addToCart(productId) {
  const res = await fetch(`${API_URL}/products/${productId}`);
  const product = await res.json();

  const cart = getCart();
  const existing = cart.find(item => item._id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  alert(`✅ ${product.name} added to cart!`);
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);
// ============ CART PAGE ============
function renderCart() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = '<p style="padding:40px;text-align:center;">Your cart is empty. <a href="index.html" style="color:#1e3a8a;">Continue shopping</a></p>';
    if (summary) summary.style.display = 'none';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" style="display:flex; gap:20px; background:white; padding:15px; border-radius:12px; margin-bottom:15px; box-shadow:0 2px 8px rgba(0,0,0,0.05); align-items:center;">
      <img src="${item.image}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
      <div style="flex:1;">
        <h3 style="color:#1e3a8a;">${item.name}</h3>
        <p style="color:#10b981; font-weight:bold; font-size:18px;">₹${item.price}</p>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <button class="btn" style="width:40px; padding:5px;" onclick="changeQty('${item._id}', -1)">−</button>
        <span style="font-size:18px; font-weight:bold;">${item.quantity}</span>
        <button class="btn" style="width:40px; padding:5px;" onclick="changeQty('${item._id}', 1)">+</button>
      </div>
      <button class="btn" style="width:auto; background:#ef4444; padding:8px 15px;" onclick="removeItem('${item._id}')">Remove</button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('cart-total').textContent = total;
  if (summary) summary.style.display = 'block';
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter(i => i._id !== id);
  saveCart(cart);
  renderCart();
}

function goToCheckout() {
  window.location.href = 'checkout.html';
}
// ============ ADMIN PANEL FUNCTIONS ============
function checkAdminLogin() {
  const token = localStorage.getItem('adminToken');
  if (token) {
    const loginBox = document.getElementById('login-box');
    const adminBox = document.getElementById('admin-box');
    if (loginBox) loginBox.style.display = 'none';
    if (adminBox) adminBox.style.display = 'block';
    loadAdminProducts();
  }
}

async function adminLogin() {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const msg = document.getElementById('login-msg');

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = '❌ ' + (data.error || 'Login failed');
      return;
    }

    if (!data.user.isAdmin) {
      msg.textContent = '❌ Not an admin account';
      return;
    }

    localStorage.setItem('adminToken', data.token);
    msg.style.color = '#10b981';
    msg.textContent = '✅ Login successful!';

    setTimeout(() => {
      document.getElementById('login-box').style.display = 'none';
      document.getElementById('admin-box').style.display = 'block';
      loadAdminProducts();
    }, 800);

  } catch (err) {
    msg.textContent = '❌ Backend error. Server running-a?';
  }
}

function logout() {
  localStorage.removeItem('adminToken');
  location.reload();
}

async function addProduct() {
  const name = document.getElementById('p-name').value;
  const description = document.getElementById('p-desc').value;
  const price = document.getElementById('p-price').value;
  const image = document.getElementById('p-image').value;
  const sizes = document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(s => s);
  const stock = document.getElementById('p-stock').value;
  const msg = document.getElementById('product-msg');

  if (!name || !description || !price || !image) {
    msg.style.color = '#ef4444';
    msg.textContent = '❌ All fields required';
    return;
  }

  const token = localStorage.getItem('adminToken');

  try {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, price: Number(price), image, sizes, stock: Number(stock) })
    });

    if (!res.ok) {
      const data = await res.json();
      msg.style.color = '#ef4444';
      msg.textContent = '❌ ' + (data.error || 'Failed');
      return;
    }

    msg.style.color = '#10b981';
    msg.textContent = '✅ Product added!';

    document.getElementById('p-name').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-image').value = '';
    document.getElementById('p-sizes').value = '';
    document.getElementById('p-stock').value = '';

    loadAdminProducts();
  } catch (err) {
    msg.textContent = '❌ Error';
  }
}

async function loadAdminProducts() {
  const container = document.getElementById('admin-products');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();

    if (!products.length) {
      container.innerHTML = '<p>No products yet.</p>';
      return;
    }

    container.innerHTML = products.map(p => `
      <div style="display:flex; gap:15px; background:white; padding:15px; border-radius:12px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,0.05); align-items:center;">
        <img src="${p.image}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/70?text=X'">
        <div style="flex:1;">
          <h4 style="color:#1e3a8a;">${p.name}</h4>
          <p style="color:#10b981; font-weight:bold;">₹${p.price}</p>
        </div>
        <button class="btn" style="width:auto; background:#ef4444; padding:8px 15px;" onclick="deleteProduct('${p._id}')">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Error loading products</p>';
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const token = localStorage.getItem('adminToken');

  await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  loadAdminProducts();
}
// ============ CHECKOUT PAGE ============
function renderCheckout() {
  const container = document.getElementById('order-items');
  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = '<p>Cart empty. <a href="index.html" style="color:#1e3a8a;">Shop now</a></p>';
    document.getElementById('order-total').textContent = '0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('order-total').textContent = total;
}

async function placeOrder() {
  const name = document.getElementById('s-name').value;
  const phone = document.getElementById('s-phone').value;
  const street = document.getElementById('s-street').value;
  const city = document.getElementById('s-city').value;
  const pincode = document.getElementById('s-pincode').value;
  const msg = document.getElementById('order-msg');

  if (!name || !phone || !street || !city || !pincode) {
    msg.style.color = '#ef4444';
    msg.textContent = '❌ All fields required';
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    msg.textContent = '❌ Cart empty';
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderData = {
    items: cart.map(item => ({
      product: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    totalAmount: total,
    address: { name, phone, street, city, pincode },
    status: 'pending'
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (!res.ok) {
      msg.style.color = '#ef4444';
      msg.textContent = '❌ ' + (data.error || 'Failed');
      return;
    }

    // Clear cart
    localStorage.removeItem('cart');
    updateCartCount();

    msg.style.color = '#10b981';
    msg.textContent = '✅ Order placed successfully! Order ID: ' + data._id;
    
    // Redirect to home after 3 sec
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);

  } catch (err) {
    msg.style.color = '#ef4444';
    msg.textContent = '❌ Error: ' + err.message;
  }
}
// ============ RAZORPAY CHECKOUT ============
async function placeOrderWithPayment() {
  const token = localStorage.getItem('adminToken');
  const cart = getCart();
  
  // Get form values
  const name = document.getElementById('ship-name')?.value || 'Guest';
  const phone = document.getElementById('ship-phone')?.value || '0000000000';
  const street = document.getElementById('ship-street')?.value || 'N/A';
  const city = document.getElementById('ship-city')?.value || 'N/A';
  const pincode = document.getElementById('ship-pincode')?.value || '000000';

  if (!cart.length) {
    alert('Cart empty!');
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    // 1. Create Razorpay order
    const res = await fetch(`${API_URL}/orders/create-razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total })
    });

    const razorpayOrder = await res.json();

    // 2. Open Razorpay checkout
    const options = {
      key: 'rzp_test_Tgxh4CnHDGizu7', // ← UNGA KEY ID paste pannunga!
      amount: razorpayOrder.amount,
      currency: 'INR',
      name: 'TechStore',
      description: 'Order Payment',
      order_id: razorpayOrder.id,
      handler: async function(response) {
        // 3. Verify payment
        const verifyRes = await fetch(`${API_URL}/orders/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderData: {
              items: cart.map(item => ({
                product: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              totalAmount: total,
              address: { name, phone, street, city, pincode }
            }
          })
        });

        const result = await verifyRes.json();
        if (result.success) {
          localStorage.removeItem('cart');
          alert('✅ Payment successful! Order placed.');
          window.location.href = 'index.html';
        } else {
          alert('❌ Payment verification failed');
        }
      },
      prefill: {
        name: name,
        contact: phone
      },
      theme: { color: '#1e3a8a' }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    alert('Error: ' + err.message);
  }
}
// ============ CHECKOUT PAGE ============
function renderCheckout() {
  const cart = getCart();
  const itemsContainer = document.getElementById('order-items');
  const totalEl = document.getElementById('order-total');

  if (!itemsContainer) return;

  if (!cart.length) {
    itemsContainer.innerHTML = '<p>Cart empty. <a href="index.html">Shop now</a></p>';
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalEl.textContent = total;
}