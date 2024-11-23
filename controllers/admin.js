const mongodb = require('mongodb');
const fileHelper = require('../util/file');
const Product = require('../models/product');
const { validationResult } = require('express-validator');

const ObjectId = mongodb.ObjectId;

exports.getAddProduct = async (req, res, next) => {
    try {
        res.render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        });
    } catch (err) {
        next(new Error(err));
    }
};

exports.postAddProduct = async (req, res, next) => {
    const { title, price, description } = req.body;
    const image = req.file;

    if (!image) {
        return res.render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: { title, price, description },
            errorMessage: 'Attached file is not an image',
            validationErrors: []
        });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: { title, price, description },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    try {
        const product = new Product({
            title,
            price,
            description,
            imageUrl: image.path,
            userId: req.user
        });

        await product.save();
        res.redirect('/admin/products');
    } catch (err) {
        next(new Error(err));
    }
};

exports.getEditProduct = async (req, res, next) => {
    const editMode = req.query.edit;
    const prodId = req.params.productId;

    if (!editMode) {
        return res.redirect('/');
    }

    try {
        const product = await Product.findById(prodId);
        if (!product) {
            return res.redirect('/');
        }

        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            product,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        });
    } catch (err) {
        next(new Error(err));
    }
};

exports.postEditProduct = async (req, res, next) => {
    const { productId, title, price, description } = req.body;
    const image = req.file;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: { title, price, description, _id: productId },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return next(new Error('Product not found.'));
        }

        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }

        product.title = title;
        product.price = price;
        product.description = description;

        if (image) {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = image.path;
        }

        await product.save();
        res.redirect('/admin/products');
    } catch (err) {
        next(new Error(err));
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ userId: req.user._id });
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products'
        });
    } catch (err) {
        next(new Error(err));
    }
};

exports.postDeleteProduct = async (req, res, next) => {
    const prodId = req.body.productId;

    try {
        const product = await Product.findById(prodId);
        if (!product) {
            return next(new Error('Product not found.'));
        }

        fileHelper.deleteFile(product.imageUrl);
        await Product.deleteOne({ _id: prodId, userId: req.user._id });
        res.redirect('/admin/products');
    } catch (err) {
        next(new Error(err));
    }
};
