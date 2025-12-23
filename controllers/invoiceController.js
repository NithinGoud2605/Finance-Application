// controllers/invoiceController.js
const { Invoice, User, Client, OrganizationUser, InvoiceLineItem } = require('../models');
const { uploadToS3, deleteFromS3, getPreSignedUrl, getStreamingUrl, fileExists } = require('../utils/s3Uploader');
const { Op, fn, col } = require('sequelize');
const notificationService = require('../services/notificationService');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

exports.upload = upload;

exports.getAllInvoices = async (req, res) => {
  try {
    console.log('=== getAllInvoices called ===');
    console.log('User:', req.user?.id);
    console.log('Headers:', req.headers['x-organization-id']);

    const user = await User.findByPk(req.user.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    let where = {};

    // Handle organization context for business accounts
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        // For business accounts without org header, just use userId
        console.log('Business account without org ID, using userId');
        where.userId = user.id;
      } else {
        try {
      const member = await OrganizationUser.findOne({
        where: { userId: user.id, organizationId: orgId }
      });
      if (!member) {
            console.log('Not a member of organization, falling back to userId');
            where.userId = user.id;
          } else {
            console.log('Organization member, using orgId');
      where.organizationId = orgId;
          }
        } catch (orgError) {
          console.log('Organization check failed, using userId:', orgError.message);
          where.userId = user.id;
        }
      }
    } else {
      // For individual accounts: show only user's data
      where.userId = user.id;
    }

    console.log('Query where:', where);

    const invoices = await Invoice.findAll({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone'],
          required: false
        },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100 // Reasonable limit
    });

    console.log('Found invoices:', invoices.length);

    // Transform and validate invoice data
    const safeInvoices = invoices.map(invoice => {
      const plainInvoice = invoice.get({ plain: true });
      
      // Parse payment information if it exists
      let paymentInformation = {};
      if (plainInvoice.paymentInformationJson) {
        try {
          paymentInformation = JSON.parse(plainInvoice.paymentInformationJson);
        } catch (e) {
          console.warn('Failed to parse payment info for invoice:', plainInvoice.id);
          paymentInformation = {};
        }
      }
      
      return {
        id: plainInvoice.id,
        invoiceNumber: plainInvoice.invoiceNumber || `INV-${plainInvoice.id}`,
        totalAmount: parseFloat(plainInvoice.totalAmount || 0),
        subTotal: parseFloat(plainInvoice.subTotal || 0),
        taxAmount: parseFloat(plainInvoice.taxAmount || 0),
        status: plainInvoice.status || 'DRAFT',
        createdAt: plainInvoice.createdAt,
        updatedAt: plainInvoice.updatedAt,
        dueDate: plainInvoice.dueDate,
        issueDate: plainInvoice.issueDate,
        clientId: plainInvoice.clientId,
        userId: plainInvoice.userId,
        organizationId: plainInvoice.organizationId,
        currency: plainInvoice.currency || 'USD',
        notes: plainInvoice.notes,
        pdfUrl: plainInvoice.pdfUrl,
        client: plainInvoice.client || null,
        lineItems: plainInvoice.lineItems || [],
        paymentInformation,
        // Add fallback fields for frontend compatibility
        number: plainInvoice.invoiceNumber || `INV-${plainInvoice.id}`,
        amount: parseFloat(plainInvoice.totalAmount || 0),
        clientName: plainInvoice.client?.name || plainInvoice.client?.companyName || 'No Client'
      };
    });

    console.log('Returning invoices:', safeInvoices.length);

    return res.json({ 
      success: true,
      invoices: safeInvoices,
      total: safeInvoices.length 
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch invoices',
      details: error.message 
    });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = {
      ...req.body,
      userId: user.id,
      status: req.body.status || 'DRAFT',
      accountType: user.accountType,
      invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`,
      issueDate: req.body.issueDate || new Date(),
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    // Handle organization context for business accounts
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }

      const member = await OrganizationUser.findOne({
        where: { userId: user.id, organizationId: orgId }
      });
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      data.organizationId = orgId;
    }

    // Extract and validate line items before processing
    const itemsData = data.items || data.details?.items || [];
    const paymentInfoData = data.paymentInformation || data.details?.paymentInformation || {};

    // Handle client creation or validation
    console.log('Client data received:', {
      clientId: data.clientId,
      hasNewClient: !!data.newClient,
      hasClient: !!data.client,
      hasReceiver: !!data.receiver,
      newClientData: data.newClient,
      clientData: data.client,
      receiverData: data.receiver
    });

    if (data.clientId) {
      console.log('Using existing client ID:', data.clientId);
      const clientWhere = { id: data.clientId };
      if (data.organizationId) {
        clientWhere.organizationId = data.organizationId;
      } else {
        clientWhere.userId = user.id;
      }
      
      const client = await Client.findOne({ where: clientWhere });
      if (!client) {
        console.log('Client not found with ID:', data.clientId);
        return res.status(404).json({ error: 'Client not found' });
      }
      console.log('Found existing client:', { id: client.id, name: client.name, email: client.email });
      // Client ID is valid, proceed without creating new client
    } else if (data.newClient) {
      console.log('Creating new client from newClient data');
      // Handle new client from missing info modal
      const clientInfo = data.newClient;
      const { name } = clientInfo;
      
      if (!name) {
        return res.status(400).json({ 
          error: 'Client name is required',
          missingFields: ['client.name']
        });
      }

      // Create new client with enhanced data validation
      const clientData = {
        name: clientInfo.name,
        email: clientInfo.email || '',
        phone: clientInfo.phone || '',
        address: clientInfo.address || '',
        city: clientInfo.city || '',
        state: clientInfo.state || '',
        zipCode: clientInfo.zipCode || '',
        country: clientInfo.country || '',
        companyName: clientInfo.companyName || '',
        userId: user.id,
        type: clientInfo.companyName ? 'business' : 'individual',
        ...(data.organizationId && { organizationId: data.organizationId })
      };

      try {
        const client = await Client.create(clientData);
        data.clientId = client.id;
        console.log('Created new client:', { id: client.id, name: client.name, email: client.email });
      } catch (err) {
        console.error('Client creation error:', err);
        return res.status(400).json({ 
          error: 'Failed to create client',
          details: err.message
        });
      }
    } else if (data.client || data.receiver) {
      console.log('Creating new client from client/receiver data');
      const clientInfo = data.client || data.receiver;
      const { name } = clientInfo;
      
      if (!name) {
        return res.status(400).json({ 
          error: 'Client name is required',
          missingFields: ['client.name']
        });
      }

      // Create new client with enhanced data validation
      const clientData = {
        name: clientInfo.name,
        email: clientInfo.email || '',
        phone: clientInfo.phone || '',
        address: clientInfo.address || '',
        city: clientInfo.city || '',
        state: clientInfo.state || '',
        zipCode: clientInfo.zipCode || '',
        country: clientInfo.country || '',
        companyName: clientInfo.companyName || '',
        userId: user.id,
        type: clientInfo.companyName ? 'business' : 'individual',
        ...(data.organizationId && { organizationId: data.organizationId })
      };

      try {
        const client = await Client.create(clientData);
        data.clientId = client.id;
        console.log('Created new client from client/receiver:', { id: client.id, name: client.name, email: client.email });
      } catch (err) {
        console.error('Client creation error:', err);
        return res.status(400).json({ 
          error: 'Failed to create client',
          details: err.message
        });
      }
    } else {
      console.log('No client information provided');
      return res.status(400).json({ 
        error: 'Client information is required',
        missingFields: ['client']
      });
    }

    // Validate and set invoice amounts
    const totalAmount = parseFloat(data.totalAmount || data.charges?.totalAmount || 0);
    const subTotal = parseFloat(data.subTotal || data.charges?.subTotal || 0);
    const taxAmount = parseFloat(data.taxAmount || data.charges?.taxAmount || 0);

    data.totalAmount = totalAmount;
    data.subTotal = subTotal;
    data.taxAmount = taxAmount;

    if (isNaN(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ 
        error: 'Valid total amount is required',
        missingFields: ['totalAmount']
      });
    }

    // Clean up nested objects for database storage
    const cleanData = {
      ...data,
      currency: data.currency || 'USD',
      notes: data.notes || data.additionalNotes || '',
      paymentTerms: data.paymentTerms || data.details?.paymentTerms || '',
      projectCode: data.projectCode || data.details?.projectCode || '',
      // Store payment information as JSON in notes field for now (we'll create a proper table later)
      paymentInformationJson: JSON.stringify(paymentInfoData)
    };

    // Log PDF URL handling
    if (data.pdfUrl) {
      console.log('Creating invoice with PDF URL:', data.pdfUrl);
    } else {
      console.log('Creating invoice without PDF URL');
    }

    // Remove nested objects that aren't part of the Invoice model
    delete cleanData.client;
    delete cleanData.newClient;
    delete cleanData.receiver;
    delete cleanData.sender;
    delete cleanData.charges;
    delete cleanData.items;
    delete cleanData.paymentInformation;
    delete cleanData.additionalNotes;
    delete cleanData.details;

    // Create the invoice first
    const invoice = await Invoice.create(cleanData);
    
    // Create line items if they exist
    if (itemsData && Array.isArray(itemsData) && itemsData.length > 0) {
      const lineItems = [];
      for (const item of itemsData) {
        if (item.name || item.description) { // Only create items with content
          try {
            const lineItem = await InvoiceLineItem.create({
              invoiceId: invoice.id,
              description: item.name || item.description || 'Unnamed Item',
              quantity: parseInt(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0
            });
            lineItems.push(lineItem);
          } catch (err) {
            console.error('Error creating line item:', err);
            // Continue with other items even if one fails
          }
        }
      }
      console.log(`Created ${lineItems.length} line items for invoice ${invoice.id}`);
    }
    
    // Return created invoice with client details and line items
    const createdInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone'],
          required: false
        },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice'],
          required: false
        }
      ]
    });

    const responseData = createdInvoice.get({ plain: true });
    
    // Parse and include payment information if it exists
    if (responseData.paymentInformationJson) {
      try {
        responseData.paymentInformation = JSON.parse(responseData.paymentInformationJson);
      } catch (e) {
        responseData.paymentInformation = {};
      }
      delete responseData.paymentInformationJson;
    }

    // Send notification for invoice creation
    try {
      await notificationService.notifyInvoiceCreated({
        invoice: responseData,
        userId: user.id,
        organizationId: data.organizationId || null
      });
    } catch (notificationError) {
      console.error('Failed to send invoice creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      ...responseData,
      message: 'Invoice created successfully'
    });
  } catch (err) {
    console.error('Error creating invoice:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    res.status(500).json({ 
      error: 'Failed to create invoice',
      details: err.message 
    });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let where = { id: req.params.id };

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }

      const member = await OrganizationUser.findOne({
        where: { userId: user.id, organizationId: orgId }
      });
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      // For business accounts: show ALL organization data
      where.organizationId = orgId;
    } else {
      // For individual accounts: show only user's data
      where.userId = user.id;
    }

    const invoice = await Invoice.findOne({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone'],
          required: false
        },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice'],
          required: false
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const plainInvoice = invoice.get({ plain: true });
    
    // Parse payment information if it exists
    if (plainInvoice.paymentInformationJson) {
      try {
        plainInvoice.paymentInformation = JSON.parse(plainInvoice.paymentInformationJson);
      } catch (e) {
        plainInvoice.paymentInformation = {};
      }
      delete plainInvoice.paymentInformationJson;
    }
    
    const responseInvoice = {
      ...plainInvoice,
      totalAmount: parseFloat(plainInvoice.totalAmount || 0),
      subTotal: parseFloat(plainInvoice.subTotal || 0),
      taxAmount: parseFloat(plainInvoice.taxAmount || 0),
      lineItems: plainInvoice.lineItems || [],
      // Add fallback fields for frontend compatibility
      number: plainInvoice.invoiceNumber,
      amount: parseFloat(plainInvoice.totalAmount || 0),
      clientName: plainInvoice.client?.name || 'No Client'
    };

    res.json(responseInvoice);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ 
      error: 'Failed to fetch invoice',
      details: err.message 
    });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    console.log('Update invoice request:', {
      invoiceId: req.params.id,
      body: req.body,
      userId: req.user?.id
    });

    const user = await User.findByPk(req.user.id);
    let where = { id: req.params.id };
    const updates = { ...req.body };

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        // For business accounts: show ALL organization data
        where.organizationId = orgId;
      }
    } else {
      // For individual accounts: show only user's data
      where.userId = user.id;
    }

    // Find existing invoice
    const invoice = await Invoice.findOne({ where });
    if (!invoice) {
      console.log('Invoice not found with where clause:', where);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    console.log('Found invoice:', { id: invoice.id, status: invoice.status });

    // Extract line items and payment information before processing other updates
    const itemsData = updates.items || updates.details?.items;
    const paymentInfoData = updates.paymentInformation || updates.details?.paymentInformation;

    // Handle client updates
    if (updates.clientId) {
      const clientWhere = { id: updates.clientId };
      if (user.accountType === 'business' && where.organizationId) {
        clientWhere.organizationId = where.organizationId;
      } else {
        clientWhere.userId = user.id;
      }
      
      const client = await Client.findOne({ where: clientWhere });
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
    } else if (updates.client || updates.receiver) {
      // Create new client if client details provided
      const clientInfo = updates.client || updates.receiver;
      const clientData = {
        ...clientInfo,
        userId: user.id,
        ...(where.organizationId && { organizationId: where.organizationId })
      };
      const client = await Client.create(clientData);
      updates.clientId = client.id;
    }

    // Handle payment information
    if (paymentInfoData) {
      updates.paymentInformationJson = JSON.stringify(paymentInfoData);
    }

    // Update additional fields from nested structures
    if (updates.details) {
      if (updates.details.paymentTerms) updates.paymentTerms = updates.details.paymentTerms;
      if (updates.details.additionalNotes) updates.notes = updates.details.additionalNotes;
    }

    // Validate amount if being updated - allow 0 for draft invoices
    if (updates.totalAmount !== undefined) {
      const amount = parseFloat(updates.totalAmount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ error: 'Total amount must be a non-negative number' });
      }
      // For non-draft invoices, require amount > 0
      if (amount === 0 && updates.status && updates.status !== 'DRAFT') {
        return res.status(400).json({ error: 'Amount must be greater than 0 for non-draft invoices' });
      }
      updates.totalAmount = amount;
    }

    console.log('Final updates to apply:', updates);

    // Remove nested objects and undefined values
    delete updates.items;
    delete updates.details;
    delete updates.paymentInformation;
    delete updates.client;
    delete updates.receiver;
    delete updates.sender;
    delete updates.charges;

    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    console.log('Cleaned updates to apply:', updates);

    // Update the invoice
    await invoice.update(updates);

    // Handle line items updates if provided
    if (itemsData && Array.isArray(itemsData)) {
      // Delete existing line items
      await InvoiceLineItem.destroy({
        where: { invoiceId: invoice.id }
      });

      // Create new line items
      for (const item of itemsData) {
        if (item.name || item.description) { // Only create items with content
          try {
            await InvoiceLineItem.create({
              invoiceId: invoice.id,
              description: item.name || item.description || 'Unnamed Item',
              quantity: parseInt(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0
            });
          } catch (err) {
            console.error('Error creating line item:', err);
            // Continue with other items even if one fails
          }
        }
      }
    }

    // Fetch updated invoice with client details and line items
    const updatedInvoice = await Invoice.findOne({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
        },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice'],
          required: false
        }
      ]
    });

    const responseData = updatedInvoice.get({ plain: true });
    
    // Parse and include payment information if it exists
    if (responseData.paymentInformationJson) {
      try {
        responseData.paymentInformation = JSON.parse(responseData.paymentInformationJson);
      } catch (e) {
        responseData.paymentInformation = {};
      }
      delete responseData.paymentInformationJson;
    }

    console.log('Invoice updated successfully');
    res.json(responseData);
  } catch (err) {
    console.error('Error updating invoice:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    let where = { id: req.params.id };

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        // For business accounts: show ALL organization data
        where.organizationId = orgId;
      }
    } else {
      // For individual accounts: show only user's data
      where.userId = user.id;
    }

    const invoice = await Invoice.findOne({ where });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete associated PDF if exists
    if (invoice.pdfUrl) {
      await deleteFromS3(invoice.pdfUrl).catch(err => {
        console.error('Error deleting PDF from S3:', err);
        // Don't fail the whole operation if S3 delete fails
      });
    }

    await invoice.destroy();
    
    res.json({ 
      success: true,
      message: 'Invoice deleted successfully',
      deletedId: invoice.id
    });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete invoice',
      details: err.message
    });
  }
};

exports.getInvoicePdf = async (req, res) => {
  try {
    console.log('=== getInvoicePdf called ===');
    console.log('Invoice ID:', req.params.id);
    console.log('Action:', req.query.action); // 'download' or 'view'
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let where = { id: req.params.id };

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        where.userId = user.id;
      } else {
        try {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
            where.userId = user.id;
          } else {
        where.organizationId = orgId;
          }
        } catch (orgError) {
          console.log('Organization check failed in PDF:', orgError.message);
          where.userId = user.id;
        }
      }
    } else {
      where.userId = user.id;
    }

    console.log('PDF query where:', where);

    const invoice = await Invoice.findOne({ where });
    if (!invoice) {
      console.log('Invoice not found');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.pdfUrl) {
      console.log('No PDF URL found');
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Validate that the file exists in S3
    const exists = await fileExists(invoice.pdfUrl);
    if (!exists) {
      console.log('PDF file not found in S3:', invoice.pdfUrl);
      return res.status(404).json({ error: 'PDF file not found in storage' });
    }

    console.log('Getting secure URL for:', invoice.pdfUrl);
    
    // Use different URL types based on the action
    const action = req.query.action;
    let url;
    
    if (action === 'download') {
      // Force download with short expiration (15 minutes)
      url = await getPreSignedUrl(invoice.pdfUrl, 900);
    } else {
      // For viewing/preview with short expiration (10 minutes)
      url = await getStreamingUrl(invoice.pdfUrl, 600);
    }
    
    console.log('Returning secure PDF URL with action:', action);
    res.json({ 
      success: true,
      url,
      action: action || 'view',
      expiresIn: action === 'download' ? 900 : 600
    });
  } catch (err) {
    console.error('Error getting invoice PDF:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get invoice PDF',
      details: err.message
    });
  }
};

exports.getInvoiceOverview = async (req, res) => {
  try {
    console.log('=== getInvoiceOverview called ===');
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let where = {};

    // Handle organization context for business accounts
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        where.userId = user.id;
      } else {
        try {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
            where.userId = user.id;
          } else {
        where.organizationId = orgId;
          }
        } catch (orgError) {
          console.log('Organization check failed in overview:', orgError.message);
          where.userId = user.id;
        }
      }
    } else {
      where.userId = user.id;
    }

    console.log('Overview query where:', where);

    // Get basic totals with safe defaults
    const totalAmount = await Invoice.sum('totalAmount', { 
      where: { ...where, totalAmount: { [Op.not]: null } }
    }) || 0;

    const paidAmount = await Invoice.sum('totalAmount', { 
      where: { ...where, status: 'PAID', totalAmount: { [Op.not]: null } }
    }) || 0;

    const pendingAmount = await Invoice.sum('totalAmount', { 
      where: { 
        ...where, 
        status: { [Op.in]: ['SENT', 'OVERDUE'] },
        totalAmount: { [Op.not]: null }
      }
    }) || 0;

    // Get invoice counts by status
    const invoiceCountsByStatus = await Invoice.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }) || [];

    // Initialize status counts with defaults - using actual database enum values
    const statusCounts = {
      DRAFT: 0,
      SENT: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELLED: 0
    };

    // Populate actual counts
    invoiceCountsByStatus.forEach(item => {
      if (item.status && typeof item.count !== 'undefined') {
        statusCounts[item.status.toUpperCase()] = parseInt(item.count) || 0;
      }
    });

    const totalInvoices = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    console.log('Overview stats:', {
      totalAmount,
      paidAmount,
      pendingAmount,
      totalInvoices,
      statusCounts
    });

    return res.json({
      success: true,
      totalAmount: parseFloat(totalAmount) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      pendingAmount: parseFloat(pendingAmount) || 0,
      totalInvoices,
      invoiceCountsByStatus: statusCounts,
      paidInvoices: statusCounts.PAID || 0,
      pendingInvoices: (statusCounts.SENT || 0) + (statusCounts.OVERDUE || 0), // SENT + OVERDUE = pending
      draftInvoices: statusCounts.DRAFT || 0,
      cancelledInvoices: statusCounts.CANCELLED || 0
    });

  } catch (err) {
    console.error('Error fetching invoice overview:', err);
    console.error('Stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch invoice overview', 
      details: err.message 
    });
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { email, message } = req.body;
    const where = { id: req.params.id, userId: user.id };

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        where.organizationId = orgId;
      }
    }

    const invoice = await Invoice.findOne({
      where,
      include: [{
        model: Client,
        as: 'client'
      }]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Use provided email or client email as fallback
    const recipientEmail = email || invoice.client?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required to send invoice' });
    }

    // Generate public view token if not exists
    if (!invoice.publicViewToken) {
      const crypto = require('crypto');
      invoice.publicViewToken = crypto.randomBytes(32).toString('hex');
      await invoice.save();
    }

    // Create public view URL
    const environmentConfig = require('../utils/environmentConfig');
const clientOrigin = environmentConfig.getClientOrigin();
    const publicViewUrl = `${clientOrigin}/public/invoice/${invoice.publicViewToken}`;

    // Send email using the email service
    const { sendInvoiceEmail } = require('../utils/emailService');
    
    try {
      await sendInvoiceEmail(recipientEmail, invoice, publicViewUrl, message || '');
      
      // Update invoice status and email tracking
      await invoice.update({ 
        status: 'SENT',
        emailSentAt: new Date(),
        emailSentTo: recipientEmail
      });

      res.json({
        message: 'Invoice sent successfully',
        invoice,
        sentTo: recipientEmail,
        publicViewUrl
      });
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError);
      res.status(500).json({ 
        error: 'Failed to send invoice email',
        details: emailError.message 
      });
    }
  } catch (err) {
    console.error('Error sending invoice:', err);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
};

// Public view endpoint for invoices
exports.getPublicInvoice = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invoice = await Invoice.findOne({
      where: { publicViewToken: token },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
        },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    // Transform invoice data for public view
    const invoiceData = invoice.get({ plain: true });
    
    // Parse payment information if it exists
    let paymentInformation = {};
    if (invoiceData.paymentInformationJson) {
      try {
        paymentInformation = JSON.parse(invoiceData.paymentInformationJson);
      } catch (e) {
        console.warn('Failed to parse payment info for public invoice:', invoiceData.id);
        paymentInformation = {};
      }
    }

    // Remove sensitive data before sending to public
    delete invoiceData.userId;
    delete invoiceData.organizationId;
    delete invoiceData.publicViewToken;

    res.json({
      invoice: {
        ...invoiceData,
        paymentInformation
      }
    });
  } catch (err) {
    console.error('Error fetching public invoice:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Send a copy of public invoice to email
exports.sendPublicInvoiceCopy = async (req, res) => {
  try {
    const { token, email, message } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const invoice = await Invoice.findOne({
      where: { publicViewToken: token },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
        },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    // Create public view URL
    const publicViewUrl = environmentConfig.getPublicViewUrl('invoice', token);

    // Send enhanced email with branding
    const { sendInvoiceEmail } = require('../utils/emailService');
    
    // Transform invoice data
    const invoiceData = invoice.get({ plain: true });
    
    // Parse payment information if it exists
    let paymentInformation = {};
    if (invoiceData.paymentInformationJson) {
      try {
        paymentInformation = JSON.parse(invoiceData.paymentInformationJson);
      } catch (e) {
        console.warn('Failed to parse payment info:', invoiceData.id);
        paymentInformation = {};
      }
    }

    const enhancedInvoiceData = {
      ...invoiceData,
      paymentInformation,
      client: invoice.client
    };

    const customMessage = message ? 
      `${message}\n\n---\n\nThis invoice was shared via Finorn - Professional Business Solutions.\nSign up for free at https://Finorn.com to create your own professional invoices!` :
      `This invoice was shared via Finorn - Professional Business Solutions.\nSign up for free at https://Finorn.com to create your own professional invoices!`;

    await sendInvoiceEmail(
      email,
      enhancedInvoiceData,
      publicViewUrl,
      customMessage,
      true // Include PDF attachment
    );

    res.json({ 
      success: true, 
      message: 'Invoice copy sent successfully',
      poweredBy: 'Finorn - Professional Business Solutions'
    });

  } catch (err) {
    console.error('Error sending public invoice copy:', err);
    res.status(500).json({ error: 'Failed to send invoice copy' });
  }
};

// Get public invoice PDF URL
exports.getPublicInvoicePdf = async (req, res) => {
  try {
    const { token } = req.params;

    const invoice = await Invoice.findOne({
      where: { publicViewToken: token },
      attributes: ['id', 'pdfUrl', 'invoiceNumber']
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    if (!invoice.pdfUrl) {
      return res.status(404).json({ error: 'PDF not available for this invoice' });
    }

    // SECURITY: Use secure proxy URL instead of exposing AWS credentials
    const secureProxyUrl = `${req.protocol}://${req.get('host')}/api/secure/pdf/${token}`;

    res.json({ 
      url: secureProxyUrl,
      filename: `Invoice_${invoice.invoiceNumber}.pdf`,
      expiresIn: 604800, // 7 days in seconds
      accessType: 'secure_proxy'
    });

  } catch (err) {
    console.error('Error getting public invoice PDF:', err);
    res.status(500).json({ error: 'Failed to get PDF URL' });
  }
};

exports.uploadInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For file uploads, we should return missing fields that need to be filled
    // Instead of creating an incomplete invoice, let's return what's missing
    
    const missingFields = [];
    
    // Required fields for invoice completion
    if (!req.body.clientId && !req.body.clientName) {
      missingFields.push('client');
    }
    
    if (!req.body.totalAmount && !req.body.amount) {
      missingFields.push('totalAmount');
    }
    
    if (!req.body.invoiceNumber) {
      missingFields.push('invoiceNumber');
    }
    
    if (!req.body.dueDate) {
      missingFields.push('dueDate');
    }

    // If we have missing fields, return them so frontend can show the modal
    // But still upload the file to S3 so we can use it later
    let uploadedFileKey = null;
    if (req.file && req.file.buffer) {
      try {
        const filename = `invoices/${Date.now()}-${req.file.originalname}`;
        const uploadResult = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
        uploadedFileKey = uploadResult.Key;
        console.log('File uploaded to S3:', uploadedFileKey);
      } catch (uploadError) {
        console.error('Error uploading file to S3:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload file to storage',
          details: uploadError.message
        });
      }
    }

    if (missingFields.length > 0) {
      return res.json({
        success: true,
        requiresCompletion: true,
        missingFields,
        uploadedFileKey, // Include the S3 key for later use
        uploadedFile: {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        message: 'File uploaded successfully. Please complete the missing invoice information.'
      });
    }

    // If all fields are provided, create the invoice with the uploaded file
    const invoiceData = {
      userId: user.id,
      status: req.body.status || 'DRAFT',
      invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount: parseFloat(req.body.totalAmount || req.body.amount || 0),
      subTotal: parseFloat(req.body.subTotal || req.body.totalAmount || req.body.amount || 0),
      taxAmount: parseFloat(req.body.taxAmount || 0),
      currency: req.body.currency || 'USD',
      notes: `Uploaded file: ${req.file.originalname}`,
      pdfUrl: uploadedFileKey // Use the actual S3 key
    };

    // Handle organization context for business accounts
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        try {
        const membership = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (membership) {
            invoiceData.organizationId = orgId;
          }
        } catch (orgError) {
          console.log('Organization membership check failed:', orgError.message);
          // Continue without org association
        }
      }
    }

    // Handle client
    if (req.body.clientId) {
      invoiceData.clientId = req.body.clientId;
    } else if (req.body.clientName) {
      // Create new client
      const clientData = {
        name: req.body.clientName,
        email: req.body.clientEmail || '',
        phone: req.body.clientPhone || '',
        address: req.body.clientAddress || '',
        userId: user.id,
        ...(invoiceData.organizationId && { organizationId: invoiceData.organizationId })
      };
      
      const client = await Client.create(clientData);
      invoiceData.clientId = client.id;
      }

    const invoice = await Invoice.create(invoiceData);

    res.json({
      success: true,
      invoiceId: invoice.id,
      message: 'Invoice created successfully from uploaded file',
      filename: req.file.originalname,
      pdfUrl: uploadedFileKey
    });
  } catch (err) {
    console.error('Invoice upload error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to upload invoice',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.getAggregatedInvoices = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    let where = {};

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        // For business accounts: show ALL organization data
        where.organizationId = orgId;
      }
    } else {
      // For individual accounts: show only user's data
      where.userId = user.id;
    }

    // Aggregate by status
    const statusAggregation = await Invoice.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('totalAmount')), 'total']
      ],
      group: ['status'],
      raw: true
    });

    // Get monthly totals for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const monthlyTotals = await Invoice.findAll({
      where: {
        ...where,
        createdAt: { [Op.gte]: twelveMonthsAgo }
      },
      attributes: [
        [fn('date_trunc', 'month', col('createdAt')), 'month'],
        [fn('SUM', col('totalAmount')), 'total'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('date_trunc', 'month', col('createdAt'))],
      order: [[fn('date_trunc', 'month', col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      byStatus: statusAggregation,
      monthlyTotals
    });
  } catch (err) {
    console.error('Error fetching aggregated invoices:', err);
    res.status(500).json({ error: 'Failed to fetch aggregated invoices' });
  }
};

exports.report = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    let where = {};

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        // For business accounts: show ALL organization data
        where.organizationId = orgId;
      }
    } else {
      // For individual accounts: show only user's data
      where.userId = user.id;
    }

    // Get total revenue
    const totalRevenue = await Invoice.sum('totalAmount', {
      where: {
        ...where,
        status: 'PAID'
      }
    }) || 0;

    // Get outstanding amount
    const outstandingAmount = await Invoice.sum('totalAmount', {
      where: {
        ...where,
        status: { [Op.in]: ['SENT', 'OVERDUE'] }
      }
    }) || 0;

    // Get invoice aging report
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const agingReport = await Invoice.findAll({
      where: {
        ...where,
        status: { [Op.in]: ['SENT', 'OVERDUE'] }
      },
      attributes: [
        [fn('SUM', col('totalAmount')), 'total'],
        [
          fn('CASE', 
            when(col('createdAt').gt(thirtyDaysAgo), '0-30'),
            when(col('createdAt').gt(sixtyDaysAgo), '31-60'),
            when(col('createdAt').gt(ninetyDaysAgo), '61-90'),
            else_('90+')
          ),
          'agingPeriod'
        ]
      ],
      group: [
        fn('CASE',
          when(col('createdAt').gt(thirtyDaysAgo), '0-30'),
          when(col('createdAt').gt(sixtyDaysAgo), '31-60'),
          when(col('createdAt').gt(ninetyDaysAgo), '61-90'),
          else_('90+')
        )
      ],
      raw: true
    });

    // Get top clients by revenue
    const topClients = await Invoice.findAll({
      where: {
        ...where,
        status: 'PAID'
      },
      attributes: [
        'clientId',
        [fn('SUM', col('totalAmount')), 'totalRevenue'],
        [fn('COUNT', col('id')), 'invoiceCount']
      ],
      include: [{
        model: Client,
        as: 'client',
        attributes: ['name', 'email', 'companyName']
      }],
      group: ['clientId', 'Client.id', 'Client.name', 'Client.email', 'Client.companyName'],
      order: [[fn('SUM', col('totalAmount')), 'DESC']],
      limit: 10
    });

    res.json({
      totalRevenue,
      outstandingAmount,
      agingReport,
      topClients
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

exports.uploadPdfOnly = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Upload the file to S3
    let uploadedFileKey = null;
    if (req.file && req.file.buffer) {
      try {
        const filename = `invoices/${Date.now()}-${req.file.originalname}`;
        const uploadResult = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
        uploadedFileKey = uploadResult.Key;
        console.log('PDF uploaded to S3:', uploadedFileKey);
      } catch (uploadError) {
        console.error('Error uploading PDF to S3:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload PDF to storage',
          details: uploadError.message
        });
      }
    }

    res.json({
      success: true,
      uploadedFileKey,
      message: 'PDF uploaded successfully to S3',
      filename: req.file.originalname
    });
  } catch (err) {
    console.error('PDF upload error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to upload PDF',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

module.exports = {
  upload: exports.upload,
  getAllInvoices: exports.getAllInvoices,
  createInvoice: exports.createInvoice,
  getInvoiceById: exports.getInvoiceById,
  updateInvoice: exports.updateInvoice,
  deleteInvoice: exports.deleteInvoice,
  getInvoicePdf: exports.getInvoicePdf,
  getInvoiceOverview: exports.getInvoiceOverview,
  sendInvoice: exports.sendInvoice,
  getPublicInvoice: exports.getPublicInvoice,
  sendPublicInvoiceCopy: exports.sendPublicInvoiceCopy,
  getPublicInvoicePdf: exports.getPublicInvoicePdf,
  uploadInvoice: exports.uploadInvoice,
  getAggregatedInvoices: exports.getAggregatedInvoices,
  report: exports.report,
  uploadPdfOnly: exports.uploadPdfOnly
};
