module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return Comment;
};
