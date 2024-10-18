const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const errorController = require('./controllers/error.js');
const db = require('./util/database.js');

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin.js');
const shopRoutes = require('./routes/shop.js');



app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

app.listen(5000);
