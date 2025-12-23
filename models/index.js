// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
let sequelize = require('../config/sequelize');

const UserModel = require('./User');
const InvoiceModel = require('./Invoice');
const PaymentModel = require('./Payment');
const SubscriptionModel = require('./Subscription');
const BankAccountModel = require('./BankAccount');
const NotificationModel = require('./Notification');
const ExpenseModel = require('./Expense');
const ClientModel = require('./Client');
const ContractModel = require('./Contract');
const InvoiceLineItemModel = require('./InvoiceLineItem');
const OrganizationModel = require('./Organization');
const OrganizationUserModel = require('./OrganizationUser');
const OrganizationActivityModel = require('./OrganizationActivity');
const DepartmentModel = require('./Department');

function initializeModels(sequelizeInstance) {
  // Initialize models
  const User = UserModel(sequelizeInstance, DataTypes);
  const Invoice = InvoiceModel(sequelizeInstance, DataTypes);
  const Payment = PaymentModel(sequelizeInstance, DataTypes);
  const Subscription = SubscriptionModel(sequelizeInstance, DataTypes);
  const BankAccount = BankAccountModel(sequelizeInstance, DataTypes);
  const Notification = NotificationModel(sequelizeInstance);
  const Expense = ExpenseModel(sequelizeInstance, DataTypes);
  const Client = ClientModel(sequelizeInstance, DataTypes);
  const Contract = ContractModel(sequelizeInstance, DataTypes);
  const InvoiceLineItem = InvoiceLineItemModel(sequelizeInstance, DataTypes);
  const Organization = OrganizationModel(sequelizeInstance, DataTypes);
  const OrganizationUser = OrganizationUserModel(sequelizeInstance, DataTypes);
  const OrganizationActivity = OrganizationActivityModel(sequelizeInstance);
  const Department = DepartmentModel(sequelizeInstance);

  // Define associations
  // Organization and User (Many-to-Many) - define this first
  Organization.belongsToMany(User, {
    through: OrganizationUser,
    foreignKey: 'organizationId',
    onDelete: 'CASCADE'
  });
  User.belongsToMany(Organization, {
    through: OrganizationUser,
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });

  // OrganizationUser associations
  Organization.hasMany(OrganizationUser, {
    foreignKey: 'organizationId',
    onDelete: 'CASCADE'
  });
  OrganizationUser.belongsTo(Organization, {
    foreignKey: 'organizationId',
    onDelete: 'CASCADE'
  });

  User.hasMany(OrganizationUser, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });
  OrganizationUser.belongsTo(User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });

  // User owned relationships
  User.hasMany(Invoice, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Invoice.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Payment, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Payment.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Subscription, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Subscription.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(BankAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
  BankAccount.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Notification.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Approver relationship for expenses
  User.hasMany(Expense, { foreignKey: 'approvedBy', as: 'approvedExpenses' });
  Expense.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

  User.hasMany(Client, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Client.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Contract, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Contract.belongsTo(User, { foreignKey: 'userId' });

  // Invoice relationships
  Invoice.hasMany(Payment, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });
  Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

  Invoice.hasMany(InvoiceLineItem, { foreignKey: 'invoiceId', as: 'lineItems', onDelete: 'CASCADE' });
  InvoiceLineItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

  // Client relationships
  Client.hasMany(Invoice, { foreignKey: 'clientId' });
  Invoice.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

  Client.hasMany(Contract, { foreignKey: 'clientId' });
  Contract.belongsTo(Client, { foreignKey: 'clientId' });

  // Organization owned relationships
  Organization.hasMany(Client, { foreignKey: 'organizationId' });
  Client.belongsTo(Organization, { foreignKey: 'organizationId' });

  Organization.hasMany(Contract, { foreignKey: 'organizationId' });
  Contract.belongsTo(Organization, { foreignKey: 'organizationId' });

  Organization.hasMany(Invoice, { foreignKey: 'organizationId' });
  Invoice.belongsTo(Organization, { foreignKey: 'organizationId' });

  Organization.hasMany(Expense, { foreignKey: 'organizationId' });
  Expense.belongsTo(Organization, { foreignKey: 'organizationId' });

  // Creator relationship for Organization
  Organization.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  // Inviter relationship for OrganizationUser
  OrganizationUser.belongsTo(User, {
    foreignKey: 'invitedBy',
    as: 'inviter'
  });

  // Contract and Client associations
  Contract.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Contract.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
  Contract.belongsTo(Organization, { foreignKey: 'organizationId' });

  // InvoiceLineItem associations
  InvoiceLineItem.belongsTo(Invoice, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });
  Invoice.hasMany(InvoiceLineItem, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });

  // Organization Activity associations
  if (OrganizationActivity.associate) {
    OrganizationActivity.associate({ User, Organization });
  }

  // Department associations  
  if (Department.associate) {
    Department.associate({ User, Organization, Department, OrganizationUser });
  }

  return {
    sequelize: sequelizeInstance,
    Sequelize,
  User,
  Invoice,
  Payment,
  Subscription,
  BankAccount,
  Notification,
  Expense,
  Client,
  Contract,
  InvoiceLineItem,
  Organization,
  OrganizationUser,
  OrganizationActivity,
    Department
  };
}

// Initialize with current sequelize instance
let db = initializeModels(sequelize);

// Function to reinitialize models with a new sequelize instance
db.reinitialize = function(newSequelizeInstance) {
  sequelize = newSequelizeInstance;
  db = initializeModels(newSequelizeInstance);
  return db;
};

module.exports = db;
