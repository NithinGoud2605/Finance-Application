// controllers/bankController.js
const { BankAccount } = require('../models');

exports.getBankAccounts = async (req, res) => {
  try {
    const userId = req.user.sub;  // Assuming your auth middleware populates req.user.sub
    const bankAccounts = await BankAccount.findAll({ where: { userId } });
    return res.json({ bankAccounts });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.connectBankAccount = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { accountNumber, bankName, accountType, routingNumber } = req.body;
    
    if (!accountNumber || !bankName) {
      return res.status(400).json({ error: 'Account number and bank name are required.' });
    }
    
    // Create a new bank account record
    const bankAccount = await BankAccount.create({
      userId,
      accountNumber,
      bankName,
      accountType,   // optional
      routingNumber  // optional
    });
    
    return res.status(201).json(bankAccount);
  } catch (error) {
    console.error("Error connecting bank account:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getBankTransactions = async (req, res) => {
  try {
    // In a real implementation, integrate with a bank API (e.g., Plaid) to get transactions.
    // For now, return dummy data.
    const dummyTransactions = [
      { id: 1, description: 'Payment Received', amount: 100, date: '2023-09-01' },
      { id: 2, description: 'Service Fee', amount: -50, date: '2023-09-03' }
    ];
    return res.json({ transactions: dummyTransactions });
  } catch (error) {
    console.error("Error fetching bank transactions:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
