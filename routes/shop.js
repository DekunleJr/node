const express = require('express');
const path = require('path')
const router = express.Router();

const shopController = require('../controllers/shop');

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct)

router.get('/cart', shopController.getCart);

router.post('/cart', shopController.postCart);

router.post('/cart-delete-item', shopController.postCartDeleteproduct);

router.post('/create-order', shopController.postOrder);

router.get('/orders', shopController.getOrders);


module.exports = router