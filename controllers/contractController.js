// controllers/contractController.js
const multer = require('multer');
const {
  Contract,
  Client,
  User,
  OrganizationUser
} = require('../models');

const {
  uploadToS3,
  getPreSignedUrl,
  getStreamingUrl,
  deleteFromS3,
  fileExists
} = require('../utils/s3Uploader');

const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const upload = multer({ storage: multer.memoryStorage() });

// Contract type mapping configuration
const CONTRACT_TYPE_MAPPING = {
  // Core Service Agreements
  'service_agreement': 'service_agreement',
  'consulting': 'consulting',
  'consulting_retainer': 'consulting_retainer',
  'freelance': 'freelance',
  'maintenance': 'maintenance',

  // Pricing Models
  'fixed_price': 'fixed_price', 
  'time_and_materials': 'time_and_materials',
  'retainer': 'retainer',

  // Technology & Licensing
  'software_license': 'software_license',
  'saas_agreement': 'saas_agreement',
  'license': 'license',
  'api_agreement': 'software_license', // Map to software_license
  'white_label': 'license', // Map to license

  // Employment & HR
  'employment': 'employment',
  'independent_contractor': 'freelance', // Map to freelance
  'internship': 'employment', // Map to employment

  // Business Partnerships
  'partnership': 'partnership',
  'joint_venture': 'partnership', // Map to partnership
  'strategic_alliance': 'partnership', // Map to partnership

  // Vendor & Supply Chain
  'vendor_agreement': 'vendor_agreement',
  'supplier_agreement': 'vendor_agreement', // Map to vendor_agreement
  'distribution_agreement': 'vendor_agreement', // Map to vendor_agreement
  'reseller_agreement': 'vendor_agreement', // Map to vendor_agreement

  // Subscription & Revenue
  'subscription': 'subscription',
  'membership': 'subscription', // Map to subscription
  'affiliate': 'service_agreement', // Map to service_agreement

  // Legal & Compliance
  'nda': 'nda',
  'non_disclosure': 'non_disclosure',
  'non_compete': 'other', // Map to other
  'data_processing': 'other', // Map to other
  'privacy_agreement': 'other', // Map to other

  // Real Estate & Facilities
  'lease_agreement': 'other', // Map to other
  'rental_agreement': 'other', // Map to other

  // Creative & Media
  'creative_services': 'service_agreement', // Map to service_agreement
  'content_license': 'license', // Map to license
  'media_production': 'service_agreement', // Map to service_agreement

  // Financial Services
  'investment_agreement': 'other', // Map to other
  'loan_agreement': 'other', // Map to other

  // Professional Services
  'legal_services': 'service_agreement', // Map to service_agreement
  'accounting_services': 'service_agreement', // Map to service_agreement
  'medical_services': 'service_agreement', // Map to service_agreement

  // Framework & Custom
  'master_service_agreement': 'service_agreement', // Map to service_agreement
  'statement_of_work': 'service_agreement', // Map to service_agreement
  'other': 'other'
};

// Helper function to transform contract data for frontend
function transformContractForFrontend(contract) {
  const contractData = typeof contract.toJSON === 'function' ? contract.toJSON() : contract;
  
  // If metadata contains original contract type, use it; otherwise use stored type
  if (contractData.metadata && contractData.metadata.originalContractType) {
    contractData.type = contractData.metadata.originalContractType;
  } else {
    contractData.type = contractData.contractType;
  }
  
  return contractData;
}

// Helper function to validate and map contract type
function validateAndMapContractType(requestedType) {
  const mappedType = CONTRACT_TYPE_MAPPING[requestedType];
  
  if (!mappedType) {
    throw new Error(`Invalid contract type: ${requestedType}. Supported types are: ${Object.keys(CONTRACT_TYPE_MAPPING).join(', ')}`);
  }
  
  return {
    requestedType,
    mappedType,
    isMapping: requestedType !== mappedType
  };
}

async function extractContractData(fileBuffer) {
  // Note: AWS Textract has been removed. This function now returns basic empty data.
  // For document text extraction, consider integrating a different service.
  try {
    logger.info('Contract data extraction called - returning empty data (Textract removed)');
    const data = {};

    return {
      startDate: data['start date'] || null,
      endDate: data['end date'] || null,
      billingCycle: data['billing cycle'] || null,
      autoRenew: data['auto renew'] === 'true',
      clientName: data['client name'] || null,
      amount: data['amount'] || null,
      terms: data['terms'] || null
    };
  } catch (err) {
    console.error('Textract error:', err);
    return {};
  }
}

const VALID_STATUS_TRANSITIONS = {
  'DRAFT': ['PENDING_SIGNATURE', 'ACTIVE', 'CANCELLED'],
  'PENDING_SIGNATURE': ['SIGNED', 'CANCELLED'],
  'SIGNED': ['ACTIVE', 'CANCELLED'],
  'ACTIVE': ['EXPIRED', 'CANCELLED'],
  'EXPIRED': ['ACTIVE'], // Only via renewal
  'CANCELLED': [] // Terminal state
};

async function validateStatusTransition(contract, newStatus) {
  const currentStatus = contract.status;
  if (!VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
}

async function validateAndGetClient(userId, clientId, client, organizationId) {
  if (clientId) {
    const existingClient = await Client.findOne({
      where: {
        id: clientId,
        userId,
        ...(organizationId && { organizationId })
      }
    });
    if (!existingClient) {
      throw new Error('Client not found');
    }
    return { clientId };
  } else if (client) {
    if (!client.name || !client.email) {
      throw new Error('Client name and email are required');
    }
    const newClient = await Client.create({
      ...client,
      userId,
      ...(organizationId && { organizationId })
    });
    return { clientId: newClient.id };
  }
  throw new Error('Client information is required');
}

exports.createContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate and map contract type
    const requestedType = req.body.contractType || 'service_agreement';
    let typeInfo;
    
    try {
      typeInfo = validateAndMapContractType(requestedType);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const data = {
      ...req.body,
      userId: user.id,
      status: 'draft',  // Use lowercase to match database enum
      accountType: user.accountType,  // Explicitly set accountType like in invoices
      contractType: typeInfo.mappedType,  // Use mapped contract type for database
      // Store original requested type and mapping in metadata
      metadata: {
        ...req.body.metadata,
        originalContractType: typeInfo.requestedType,
        mappedContractType: typeInfo.mappedType,
        typeMapping: typeInfo.isMapping,
        createdAt: new Date().toISOString()
      }
    };

    // Handle organization context for business accounts (same as invoices)
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }

      try {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        data.organizationId = orgId;
      } catch (orgError) {
        console.log('Organization check failed:', orgError.message);
        return res.status(500).json({ error: 'Failed to verify organization membership' });
      }
    }

    // Handle client creation or validation (same pattern as invoices)
    console.log('Client data received:', {
      clientId: data.clientId,
      hasNewClient: !!data.newClient,
      hasClient: !!data.client,
      newClientData: data.newClient,
      clientData: data.client
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

      // Create new client
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
    } else if (data.client) {
      console.log('Creating new client from client data');
      const clientInfo = data.client;
      const { name } = clientInfo;
      
      if (!name) {
        return res.status(400).json({ 
          error: 'Client name is required',
          missingFields: ['client.name']
        });
      }

      // Create new client
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
        console.log('Created new client from client data:', { id: client.id, name: client.name, email: client.email });
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

    // Clean up data before creating contract (remove nested objects like invoices)
    const cleanData = {
      ...data,
      currency: data.currency || 'USD',
      description: data.description || '',
      terms: data.terms || ''
    };

    // Remove nested objects that aren't part of the Contract model
    delete cleanData.client;
    delete cleanData.newClient;
    
    // Debug: Log the final data being passed to Contract.create
    console.log('Creating contract with cleaned data:', JSON.stringify(cleanData, null, 2));
    console.log('User info:', { id: user.id, accountType: user.accountType });

    const contract = await Contract.create(cleanData);

    // Return with client details
    const createdContract = await Contract.findByPk(contract.id, {
      include: [{
        model: Client,
        attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
      }]
    });

    // Transform contract to include original contract type for frontend
    const contractData = transformContractForFrontend(createdContract);

    // Send notification for contract creation
    try {
      await notificationService.notifyContractCreated({
        contract: createdContract,
        userId: user.id,
        organizationId: data.organizationId || null
      });
    } catch (notificationError) {
      console.error('Failed to send contract creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json(contractData);
  } catch (err) {
    console.error('Error creating contract:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: err.message,
        validationErrors: err.errors
      });
    }
    res.status(500).json({ error: 'Failed to create contract' });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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

    const contract = await Contract.findOne({ where });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Handle contract type updates with mapping
    if (updates.contractType) {
      try {
        const typeInfo = validateAndMapContractType(updates.contractType);
        
        // Update the contract type and metadata
        updates.contractType = typeInfo.mappedType;
        updates.metadata = {
          ...contract.metadata,
          ...updates.metadata,
          originalContractType: typeInfo.requestedType,
          mappedContractType: typeInfo.mappedType,
          typeMapping: typeInfo.isMapping,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    // Handle client updates
    if (updates.clientId || updates.client) {
      try {
        const clientData = await validateAndGetClient(
          user.id,
          updates.clientId,
          updates.client,
          where.organizationId
        );
        Object.assign(updates, clientData);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    await contract.update(updates);

    // Return updated contract with client details
    const updatedContract = await Contract.findOne({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
      }]
    });

    // Transform contract to include original contract type for frontend
    const contractData = transformContractForFrontend(updatedContract);

    res.json(contractData);
  } catch (err) {
    console.error('Error updating contract:', err);
    res.status(500).json({ error: 'Failed to update contract' });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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

    const contract = await Contract.findOne({ where });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Delete associated files from S3 if they exist
    if (contract.fileUrl) {
      try {
        await deleteFromS3(contract.fileUrl);
      } catch (err) {
        console.error('Error deleting file from S3:', err);
        // Continue with contract deletion even if file deletion fails
      }
    }

    await contract.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting contract:', err);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
};

exports.approveContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
    
    const contract = await Contract.findOne({ where });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    await contract.update({
      approvalStatus: 'APPROVED',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    // Send notification for contract approval
    try {
      await notificationService.createNotification({
        userId: contract.userId,
        organizationId: contract.organizationId || null,
        type: 'CONTRACT_APPROVED',
        data: {
          contractTitle: contract.title || contract.name || 'Contract',
          contractId: contract.id,
          approverName: user.name || user.email
        },
        channels: ['IN_APP', 'EMAIL']
      });
    } catch (notificationError) {
      console.error('Failed to send contract approval notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json(contract);
  } catch (err) {
    console.error('Error approving contract:', err);
    res.status(500).json({ error: 'Failed to approve contract' });
  }
};

exports.cancelContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
    
    const contract = await Contract.findOne({ where });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    await contract.update({
      status: 'CANCELLED',
      cancelledAt: new Date()
    });

    res.json({
      message: 'Contract cancelled successfully',
      contract
    });
  } catch (err) {
    console.error('Error cancelling contract:', err);
    res.status(500).json({ error: 'Failed to cancel contract' });
  }
};

exports.renewContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
    
    const oldContract = await Contract.findOne({ where });

    if (!oldContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Calculate new contract terms
    const renewalTerms = oldContract.renewalTerms || {
      duration: 365,
      priceAdjustment: 0,
      notificationDays: [30, 15, 7]
    };

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + renewalTerms.duration);

    // Apply price adjustment if specified
    const newValue = oldContract.value * (1 + (renewalTerms.priceAdjustment / 100));

    const newContract = await Contract.create({
      ...oldContract.toJSON(),
      id: undefined,
      status: 'ACTIVE',
      startDate,
      endDate,
      value: newValue,
      createdAt: undefined,
      updatedAt: undefined,
      approvalStatus: 'PENDING',
      approvedBy: null,
      approvedAt: null,
      cancelledAt: null,
      lastRenewalDate: startDate,
      nextRenewalDate: oldContract.autoRenew ? endDate : null,
      renewalHistory: [],
      notificationsSent: []
    });

    // Update old contract's status to expired if not already
    if (oldContract.status !== 'EXPIRED') {
      await oldContract.update({ 
        status: 'EXPIRED',
        nextRenewalDate: null
      });
    }

    res.json({
      message: 'Contract renewed successfully',
      contract: newContract,
      priceAdjustment: renewalTerms.priceAdjustment > 0 ? 
        `Price adjusted by ${renewalTerms.priceAdjustment}%` : null
    });
  } catch (err) {
    console.error('Error renewing contract:', err);
    res.status(500).json({ error: 'Failed to renew contract' });
  }
};

// Add a new endpoint to handle renewal settings
exports.updateRenewalSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
    
    const contract = await Contract.findOne({ where });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const { autoRenew, renewalTerms } = req.body;

    await contract.update({
      autoRenew,
      renewalTerms: {
        ...contract.renewalTerms,
        ...renewalTerms
      },
      nextRenewalDate: autoRenew ? contract.endDate : null
    });

    res.json({
      message: 'Renewal settings updated successfully',
      contract
    });
  } catch (err) {
    console.error('Error updating renewal settings:', err);
    res.status(500).json({ error: 'Failed to update renewal settings' });
  }
};

// Add a new function to check for contracts nearing expiration
exports.checkExpiringContracts = async () => {
  try {
    const contracts = await Contract.findAll({
      where: {
        status: 'ACTIVE',
        endDate: {
          [Op.lt]: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // Within next 30 days
        }
      },
      include: [
        {
          model: Client,
          attributes: ['email']
        },
        {
          model: User,
          attributes: ['email']
        }
      ]
    });

    for (const contract of contracts) {
      const daysToExpiry = Math.ceil((contract.endDate - new Date()) / (1000 * 60 * 60 * 24));
      const notificationDays = contract.renewalTerms?.notificationDays || [30, 15, 7];
      const notificationsSent = contract.notificationsSent || [];

      if (notificationDays.includes(daysToExpiry) && !notificationsSent.includes(daysToExpiry)) {
        // Send notification logic here
        // TODO: Integrate with notification system
        
        // Record that notification was sent
        notificationsSent.push(daysToExpiry);
        await contract.update({ notificationsSent });
      }

      // Handle auto-renewal if contract is expired
      if (daysToExpiry <= 0 && contract.autoRenew) {
        await exports.renewContract({ 
          params: { id: contract.id },
          user: { id: contract.userId }
        }, { json: () => {} });
      }
    }
  } catch (err) {
    console.error('Error checking expiring contracts:', err);
  }
};

// Send Contract Email
exports.sendContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { email, message } = req.body;
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
        where.organizationId = orgId;
      }
    } else {
      where.userId = user.id;
    }

    const contract = await Contract.findOne({
      where,
      include: [{
        model: Client,
        as: 'client'
      }]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Use provided email or client email as fallback
    const recipientEmail = email || contract.client?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required to send contract' });
    }

    // Generate public view token if not exists
    if (!contract.publicViewToken) {
      const crypto = require('crypto');
      contract.publicViewToken = crypto.randomBytes(32).toString('hex');
      await contract.save();
    }

    // Create public view URL
    const environmentConfig = require('../utils/environmentConfig');
const clientOrigin = environmentConfig.getClientOrigin();
    const publicViewUrl = `${clientOrigin}/public/contract/${contract.publicViewToken}`;

    // Send email using the email service
    const { sendContractEmail } = require('../utils/emailService');
    
    try {
      await sendContractEmail(recipientEmail, contract, publicViewUrl, message || '');
      
      // Update contract status and email tracking
      await contract.update({ 
        status: 'sent',
        emailSentAt: new Date(),
        emailSentTo: recipientEmail
      });

      res.json({
        message: 'Contract sent successfully',
        contract,
        sentTo: recipientEmail,
        publicViewUrl
      });
    } catch (emailError) {
      console.error('Error sending contract email:', emailError);
      res.status(500).json({ 
        error: 'Failed to send contract email',
        details: emailError.message 
      });
    }
  } catch (err) {
    console.error('Error sending contract:', err);
    res.status(500).json({ error: 'Failed to send contract' });
  }
};

// Public view endpoint for contracts
exports.getPublicContract = async (req, res) => {
  try {
    const { token } = req.params;
    
    const contract = await Contract.findOne({
      where: { publicViewToken: token },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or link expired' });
    }

    // Transform contract data for public view
    const contractData = contract.get({ plain: true });

    // Remove sensitive data before sending to public
    delete contractData.userId;
    delete contractData.organizationId;
    delete contractData.publicViewToken;
    delete contractData.approvedBy;

    res.json({
      contract: contractData
    });
  } catch (err) {
    console.error('Error fetching public contract:', err);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
};

exports.sendForSignature = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
    
    const contract = await Contract.findOne({
      where,
      include: [{
        model: Client,
        attributes: ['email']
      }]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (!contract.Client?.email) {
      return res.status(400).json({ error: 'Client email is required for signature request' });
    }

    await contract.update({
      status: 'PENDING_SIGNATURE',
      sentForSignatureAt: new Date()
    });

    // TODO: Integrate with e-signature service (DocuSign/HelloSign)
    
    res.json({
      message: 'Contract sent for signature',
      contract
    });
  } catch (err) {
    console.error('Error sending contract for signature:', err);
    res.status(500).json({ error: 'Failed to send contract for signature' });
  }
};

exports.getContractPdf = async (req, res) => {
  try {
    console.log('=== getContractPdf called ===');
    console.log('Contract ID:', req.params.id);
    console.log('Action:', req.query.action); // 'download' or 'view'
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
    
    const contract = await Contract.findOne({ where });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check both pdfUrl and contractUrl fields (legacy support)
    let pdfKey = contract.pdfUrl || contract.contractUrl;
    if (!pdfKey) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // SECURITY: Only accept S3 keys, never process URLs
    // This prevents exposure of AWS credentials and file locations
    if (pdfKey.startsWith('https://') || pdfKey.includes('.amazonaws.com')) {
      console.error('Security violation: URLs not allowed, only S3 keys:', pdfKey);
      return res.status(400).json({ error: 'Invalid file reference format' });
    }

    // Validate that the file exists in S3
    const exists = await fileExists(pdfKey);
    if (!exists) {
      console.log('PDF file not found in S3:', pdfKey);
      return res.status(404).json({ error: 'PDF file not found in storage' });
    }

    console.log('Getting secure URL for:', pdfKey);
    
    // Use different URL types based on the action
    const action = req.query.action;
    let url;
    
    if (action === 'download') {
      // Force download with short expiration (15 minutes)
      url = await getPreSignedUrl(pdfKey, 900);
    } else {
      // For viewing/preview with short expiration (10 minutes)
      url = await getStreamingUrl(pdfKey, 600);
    }

    console.log('Returning secure PDF URL with action:', action);
    res.json({ 
      success: true,
      url,
      action: action || 'view',
      expiresIn: action === 'download' ? 900 : 600
    });
  } catch (err) {
    console.error('Error getting contract PDF:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get PDF',
      details: err.message
    });
  }
};

exports.getAllContracts = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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

    const contracts = await Contract.findAll({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transform contracts to include original contract type for frontend
    const transformedContracts = contracts.map(contract => transformContractForFrontend(contract));

    res.json(transformedContracts);
  } catch (err) {
    console.error('Error getting contracts:', err);
    res.status(500).json({ error: 'Failed to get contracts' });
  }
};

exports.getContract = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const where = { id: req.params.id, userId: user.id };

    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        where.organizationId = orgId;
      }
    }

    const contract = await Contract.findOne({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
      }]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Transform contract to include original contract type for frontend
    const contractData = transformContractForFrontend(contract);

    res.json(contractData);
  } catch (err) {
    console.error('Error getting contract:', err);
    res.status(500).json({ error: 'Failed to get contract' });
  }
};

exports.uploadContract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to S3
    const s3Key = `contracts/${req.user.id}/${Date.now()}-${req.file.originalname}`;
    const uploadResult = await uploadToS3(req.file.buffer, s3Key);

    // Skip textract extraction - direct upload only
    const extractedData = {}; // Empty object since we're not extracting data

    res.json({
      message: 'File uploaded successfully',
      success: true,
      uploadedFileKey: s3Key, // Only return the S3 key, never the full URL
      extractedData
    });
  } catch (err) {
    console.error('Error uploading contract:', err);
    res.status(500).json({ error: 'Failed to upload contract' });
  }
};

exports.uploadPdfOnly = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Upload PDF to S3
    const s3Key = `contracts/pdfs/${req.user.id}/${Date.now()}-${req.file.originalname}`;
    const uploadResult = await uploadToS3(req.file.buffer, s3Key);

    res.json({
      message: 'PDF uploaded successfully',
      success: true,
      uploadedFileKey: s3Key
    });
  } catch (err) {
    console.error('Error uploading PDF:', err);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
};

// Send a copy of public contract to email
exports.sendPublicContractCopy = async (req, res) => {
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

    const contract = await Contract.findOne({
      where: { publicViewToken: token },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'companyName', 'address', 'phone']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or link expired' });
    }

    // Create public view URL
    const publicViewUrl = environmentConfig.getPublicViewUrl('contract', token);

    // Send enhanced email with branding
    const { sendContractEmail } = require('../utils/emailService');
    
    // Transform contract data
    const contractData = contract.get({ plain: true });

    const customMessage = message ? 
      `${message}\n\n---\n\nThis contract was shared via Finorn - Professional Business Solutions.\nSign up for free at https://Finorn.com to create your own professional contracts!` :
      `This contract was shared via Finorn - Professional Business Solutions.\nSign up for free at https://Finorn.com to create your own professional contracts!`;

    await sendContractEmail(
      email,
      contractData,
      publicViewUrl,
      customMessage,
      true // Include PDF attachment
    );

    res.json({ 
      success: true, 
      message: 'Contract copy sent successfully',
      poweredBy: 'Finorn - Professional Business Solutions'
    });

  } catch (err) {
    console.error('Error sending public contract copy:', err);
    res.status(500).json({ error: 'Failed to send contract copy' });
  }
};

// Get public contract PDF URL
exports.getPublicContractPdf = async (req, res) => {
  try {
    const { token } = req.params;

    const contract = await Contract.findOne({
      where: { publicViewToken: token },
      attributes: ['id', 'pdfUrl', 'contractUrl', 'title']
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or link expired' });
    }

    const pdfKey = contract.pdfUrl || contract.contractUrl;
    if (!pdfKey) {
      return res.status(404).json({ error: 'PDF not available for this contract' });
    }

    // SECURITY: Only accept S3 keys, never process URLs for public access
    if (pdfKey.startsWith('https://') || pdfKey.includes('.amazonaws.com')) {
      console.error('Security violation: URLs not allowed in public access:', pdfKey);
      return res.status(400).json({ error: 'Invalid file reference format' });
    }

    // SECURITY: Use secure proxy URL instead of exposing AWS credentials
    const secureProxyUrl = `${req.protocol}://${req.get('host')}/api/secure/contract-pdf/${token}`;

    res.json({ 
      url: secureProxyUrl,
      filename: `Contract_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      expiresIn: 604800, // 7 days in seconds
      accessType: 'secure_proxy'
    });

  } catch (err) {
    console.error('Error getting public contract PDF:', err);
    res.status(500).json({ error: 'Failed to get PDF URL' });
  }
};

module.exports = {
  upload,
  uploadContract: exports.uploadContract,
  uploadPdfOnly: exports.uploadPdfOnly,
  getAllContracts: exports.getAllContracts,
  getContract: exports.getContract,
  updateContract: exports.updateContract,
  deleteContract: exports.deleteContract,
  approveContract: exports.approveContract,
  cancelContract: exports.cancelContract,
  renewContract: exports.renewContract,
  sendForSignature: exports.sendForSignature,
  sendContract: exports.sendContract,
  getPublicContract: exports.getPublicContract,
  sendPublicContractCopy: exports.sendPublicContractCopy,
  getPublicContractPdf: exports.getPublicContractPdf,
  getContractPdf: exports.getContractPdf,
  createContract: exports.createContract
};
