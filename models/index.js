const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Post = require('./post')(sequelize, DataTypes);
db.Comment = require('./comment')(sequelize, DataTypes);

// Relationships
db.Post.hasMany(db.Comment, { as: 'comments' });
db.Comment.belongsTo(db.Post, {
  foreignKey: 'postId',
  as: 'post',
});

module.exports = db;
