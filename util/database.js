const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'Sa@726835', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;