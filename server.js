const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const errorController = require('./controllers/error.js');

const User = require('./models/user.js');

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin.js');
const shopRoutes = require('./routes/shop.js');



app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('6718f73016a8536bd756157e')
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        'mongodb+srv://adekunlesa10:DekunleSamOye@nodeserver.midgx.mongodb.net/shop?retryWrites=true'
    )
    .then(result => {
        User
            .findOne()
            .then(user => {
                if (!user) {
                    const user = new User({
                        name: 'Samuel',
                        email: 'samuel@test.com',
                        cart: {
                            items: []
                        }
                    });
                    user.save();
                }
            });
        app.listen(5000);
        console.log('Connected!');
    })
    .catch(err => console.log(err));


