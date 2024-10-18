const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const errorController = require('./controllers/error.js');
const sequelize = require('./util/database.js');
const Product = require('./models/product.js');
const User = require('./models/user.js');
const Cart = require('./models/cart.js');
const CartItem = require('./models/cart-item.js');
const Order = require('./models/order.js');
const OrderItem = require('./models/order-item.js');

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin.js');
const shopRoutes = require('./routes/shop.js');
const { constrainedMemory } = require('process');



app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findAll({ where: { id: 1} })
    .then(user => {
        req.user = user[0];
        next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
    .sync()
    .then(result => {
        return User.findAll({ where: { id: 1} });  
    })
    .then(user => {
        if (!user[0]) {
            return User.create({ name: 'Sam', email: 'ade@gmail.com'});
        }
        return user[0];
    })
    .then(user => {
        return user.createCart();
    })
    .then(cart => {
        app.listen(5000);
    })
    .catch(err => {
        console.log(err);
    });


