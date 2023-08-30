const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(express.json());

const productsPath = path.join(__dirname, 'src', 'products.json');
const cartsPath = path.join(__dirname, 'src', 'carts.json');

let products = JSON.parse(fs.readFileSync(productsPath));
let carts = JSON.parse(fs.readFileSync(cartsPath));

const productsRouter = express.Router();

productsRouter.get('/', (req, res) => {
  res.json(products);
});

productsRouter.get('/:pid', (req, res) => {
  const product = products.find(product => product.id === req.params.pid);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

productsRouter.post('/', (req, res) => {
  const newProduct = {
    id: generateUniqueId(),
    ...req.body
  };
  products.push(newProduct);
  saveDataToFile(productsPath, products);
  res.status(201).json(newProduct);
});

productsRouter.put('/:pid', (req, res) => {
  const productIndex = products.findIndex(product => product.id === req.params.pid);
  if (productIndex !== -1) {
    products[productIndex] = { ...products[productIndex], ...req.body };
    saveDataToFile(productsPath, products);
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

productsRouter.delete('/:pid', (req, res) => {
  products = products.filter(product => product.id !== req.params.pid);
  saveDataToFile(productsPath, products);
  res.status(204).end();
});

app.use('/api/products', productsRouter);

const cartsRouter = express.Router();

cartsRouter.post('/', (req, res) => {
  const newCart = {
    id: generateUniqueId(),
    products: []
  };
  carts.push(newCart);
  saveDataToFile(cartsPath, carts);
  res.status(201).json(newCart);
});

cartsRouter.get('/:cid', (req, res) => {
  const cart = carts.find(cart => cart.id === req.params.cid);
  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ message: 'Carrito no encontrado' });
  }
});

cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cart = carts.find(cart => cart.id === req.params.cid);
  const product = products.find(product => product.id === req.params.pid);

  if (!cart || !product) {
    res.status(404).json({ message: 'Carrito o producto no encontrado' });
  } else {
    const existingProduct = cart.products.find(item => item.product === req.params.pid);
    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.products.push({ product: req.params.pid, quantity: 1 });
    }
    saveDataToFile(cartsPath, carts);
    res.json(cart.products);
  }
});

app.use('/api/carts', cartsRouter);

app.get('/', (req, res) => {
  res.redirect('/api/products');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

function saveDataToFile(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}
