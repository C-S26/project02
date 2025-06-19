const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/toy_Store', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const Toy = mongoose.model('Toy', new mongoose.Schema({
  name: String, categoryId: String, price: Number, image: String
}));

const Customer = mongoose.model('Customer', new mongoose.Schema({
  name: String, email: String, password: String, address: String, phone: Number
}));

// Routes
app.get('/api/toys', async (req, res) => {
  const toys = await Toy.find();
  res.json(toys);
});

app.post('/api/toys', async (req, res) => {
  const toy = new Toy(req.body);
  const saved = await toy.save();
  res.json(saved);
});

app.post('/api/customers', async (req, res) => {
  const customer = new Customer(req.body);
  const saved = await customer.save();
  res.json(saved);
});

app.post('/api/customers/login', async (req, res) => {
  const { email, password } = req.body;
  const customer = await Customer.findOne({ email, password });
  if (customer) res.json(customer);
  else res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
