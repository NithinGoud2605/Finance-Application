const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InvoiceLineItem = sequelize.define('InvoiceLineItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'invoice_line_items',
    timestamps: true
  });

  return InvoiceLineItem;
};
