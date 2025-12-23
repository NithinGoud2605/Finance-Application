const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: { 
      type: DataTypes.UUID, 
      allowNull: false 
    },
    clientId: { 
      type: DataTypes.UUID, 
      allowNull: true 
    },
    organizationId: { 
      type: DataTypes.UUID, 
      allowNull: true 
    },
    accountType: {
      type: DataTypes.ENUM('individual', 'business'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'),
      defaultValue: 'DRAFT'
    },
    invoiceNumber: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    issueDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    dueDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    subTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    purchaseOrderNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    projectCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    departmentCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    latePaymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pdfUrl: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    templateId: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    paymentInformationJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Stores payment information as JSON string'
    },
    publicViewToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Unique token for public viewing of invoice'
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When invoice was last emailed to client'
    },
    emailSentTo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email address invoice was sent to'
    }
  }, {
    tableName: 'invoices',
    timestamps: true
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Invoice.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    Invoice.belongsTo(models.Organization, { foreignKey: 'organizationId', as: 'organization' });
    Invoice.hasMany(models.InvoiceLineItem, { foreignKey: 'invoiceId', as: 'lineItems' });
  };

  return Invoice;
};
