const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(`${process.env.STRIPE_KEY}`);
const PDFDocument = require('pdfkit');
const Product = require('../models/product');
const Order = require('../models/order');
const ITEMS_PER_PAGE = 3;

exports.getProducts = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    res.render('shop/product-details', {
      product: product,
      pageTitle: product.title,
      path: '/products',
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.getIndex = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');
    const products = user.cart.items;
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.postCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);
    await req.user.addToCart(product);
    res.redirect('/');
  } catch (err) {
    next(new Error(err));
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    await req.user.deleteItemFromCart(prodId);
    res.redirect('/cart');
  } catch (err) {
    next(new Error(err));
  }
};

exports.getCheckout = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');
    const products = user.cart.items;
    let total = 0;
    products.forEach((p) => {
      total += p.quantity * p.productId.price;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map((p) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: p.productId.title,
            description: p.productId.description,
          },
          unit_amount: p.productId.price * 100,
        },
        quantity: p.quantity,
      })),
      mode: 'payment',
      success_url: 'https://dekunle-market.onrender.com/checkout/success',
      cancel_url: 'https://dekunle-market.onrender.com/checkout/cancel',
    });

    res.redirect(303, session.url);
  } catch (err) {
    next(new Error(err));
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId');
    const products = user.cart.items.map((i) => ({
      quantity: i.quantity,
      product: { ...i.productId._doc },
    }));
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user,
      },
      products: products,
    });
    await order.save();
    await req.user.clearCart();
    res.redirect('/orders');
  } catch (err) {
    next(new Error(err));
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ 'user.userId': req.user._id });
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
    });
  } catch (err) {
    next(new Error(err));
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('No order found.');
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      throw new Error('Unauthorized.');
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);

    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + invoiceName + '"'
    );

    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice', { underline: true });
    pdfDoc.text('____________________________');

    let totalPrice = 0;
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(
        `${prod.product.title} - ${prod.quantity} x $${prod.product.price}`
      );
    });

    pdfDoc.text('____________________________');
    pdfDoc.fontSize(18).text(`Total Price: $${totalPrice}`);
    pdfDoc.end();
  } catch (err) {
    next(new Error(err));
  }
};
