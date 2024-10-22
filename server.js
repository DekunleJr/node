const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const errorController = require('./controllers/error.js');
const mongoConnect = require('./util/database.js').mongoConnect;
const User = require('./models/user.js');

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin.js');
const shopRoutes = require('./routes/shop.js');



app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('67165f9ec902793c8f4b0ddc')
    .then(user => {
        req.user = new User(user.name, user.email, user.cart, user._id);
        next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoConnect(() => {
    app.listen(5000);
});


