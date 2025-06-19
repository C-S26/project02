const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Parse JSON bodies

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/toy_Store', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Customer Schema & Model
const customerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  address: String,
  phone: String
});
const Customer = mongoose.model('Customer', customerSchema);

// Toy Schema & Model
const toySchema = new mongoose.Schema({
  name: String,
  categoryId: String,
  price: Number,
  image: String,
});
const Toy = mongoose.model('Toy', toySchema);

// Category Schema & Model
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
});
const Category = mongoose.model('Category', categorySchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // Check if user already exists
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Customer({ 
      name, 
      email, 
      password: hashedPassword, 
      address, 
      phone 
    });

    await newCustomer.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful', 
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        address: user.address,
        phone: user.phone
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile (protected route)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await Customer.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Customer routes (keeping existing for compatibility)
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = new Customer({ 
      name, 
      email, 
      password: hashedPassword, 
      address, 
      phone 
    });
    const saved = await customer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// Get all toys
app.get('/api/toys', async (req, res) => {
  try {
    const toys = await Toy.find();
    res.json(toys);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch toys' });
  }
});

// Add a new toy
app.post('/api/toys', async (req, res) => {
  try {
    const { name, categoryId, price, image } = req.body;
    const newToy = new Toy({ name, categoryId, price, image });
    const savedToy = await newToy.save();
    res.status(201).json(savedToy);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add toy' });
  }
});

app.delete('/api/toys/:id', async (req, res) => {
  try {
    const result = await Toy.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Toy not found' });
    res.json({ message: 'Toy deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete toy' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('✅ Backend running at http://localhost:3000');
});
