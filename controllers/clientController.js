// controllers/clientController.js
const { Client, User, Invoice, Contract, OrganizationUser, Project, Activity } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const notificationService = require('../services/notificationService');

exports.getAllClients = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    let where = {};

    if (user.accountType === 'business') {
      const organizationId = req.headers['x-organization-id'];
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }
      
        const membership = await OrganizationUser.findOne({
          where: { userId, organizationId }
        });
        if (!membership) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
      
      // For business accounts: show ALL organization data
        where.organizationId = organizationId;
    } else {
      // For individual accounts: show only user's data
      where.userId = userId;
    }

    const clients = await Client.findAll({
      where,
      include: [
        {
          model: Invoice,
          attributes: ['id', 'totalAmount', 'status', 'dueDate'],
          required: false
        },
        {
          model: Contract,
          attributes: ['id', 'status', 'startDate', 'endDate'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    return res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    const clientData = {
      ...req.body,
      userId
    };

    // Handle organization context for business accounts
    if (user.accountType === 'business') {
      const organizationId = req.headers['x-organization-id'];
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }
      
        const membership = await OrganizationUser.findOne({
          where: { userId, organizationId }
        });
        if (!membership) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        clientData.organizationId = organizationId;
    }

    // Validate required fields
    if (!clientData.name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    if (clientData.email && !isValidEmail(clientData.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check for duplicate client
    const existingClient = await Client.findOne({
      where: {
        userId,
        [Op.or]: [
          { email: clientData.email },
          { name: clientData.name }
        ],
        ...(clientData.organizationId && { organizationId: clientData.organizationId })
      }
    });

    if (existingClient) {
      return res.status(409).json({ error: 'Client with this name or email already exists' });
    }

    const client = await Client.create(clientData);

    // Send notification for client creation
    try {
      await notificationService.createNotification({
        userId: userId,
        organizationId: clientData.organizationId || null,
        type: 'CLIENT_CREATED',
        data: {
          clientName: client.name,
          clientId: client.id,
          clientEmail: client.email || 'No email provided'
        },
        channels: ['IN_APP']
      });
    } catch (notificationError) {
      console.error('Failed to send client creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
};

exports.getClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    let where = { 
      id: req.params.id
    };

    if (user.accountType === 'business') {
      const organizationId = req.headers['x-organization-id'];
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }
      
      const membership = await OrganizationUser.findOne({
        where: { userId, organizationId }
      });
      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      // For business accounts: show ALL organization data
      where.organizationId = organizationId;
    } else {
      // For individual accounts: show only user's data
      where.userId = userId;
    }

    const client = await Client.findOne({
      where,
      include: [
        {
          model: Invoice,
          attributes: ['id', 'totalAmount', 'status', 'dueDate'],
          required: false,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Contract,
          attributes: ['id', 'status', 'startDate', 'endDate'],
          required: false,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ error: 'Failed to fetch client', details: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    let where = {
      id: req.params.id
    };

    if (user.accountType === 'business') {
      const organizationId = req.headers['x-organization-id'];
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }
      
      const membership = await OrganizationUser.findOne({
        where: { userId, organizationId }
      });
      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      // For business accounts: show ALL organization data
      where.organizationId = organizationId;
    } else {
      // For individual accounts: show only user's data
      where.userId = userId;
    }

    const client = await Client.findOne({ where });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;
    delete updates.organizationId;

    // Validate email if being updated
    if (updates.email && !isValidEmail(updates.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check for duplicate if name or email is being updated
    if (updates.name || updates.email) {
      const duplicateWhere = {
          id: { [Op.ne]: client.id },
          [Op.or]: [
            updates.email ? { email: updates.email } : null,
            updates.name ? { name: updates.name } : null
        ].filter(Boolean)
      };

      // Apply same organization/user context for duplicate check
      if (user.accountType === 'business' && client.organizationId) {
        duplicateWhere.organizationId = client.organizationId;
      } else {
        duplicateWhere.userId = userId;
      }

      const existingClient = await Client.findOne({
        where: duplicateWhere
      });

      if (existingClient) {
        return res.status(409).json({ error: 'Client with this name or email already exists' });
      }
    }

    await client.update(updates);

    // Fetch updated client with related data
    const updatedClient = await Client.findOne({
      where,
      include: [
        {
          model: Invoice,
          attributes: ['id', 'totalAmount', 'status', 'dueDate'],
          required: false
        },
        {
          model: Contract,
          attributes: ['id', 'status', 'startDate', 'endDate'],
          required: false
        }
      ]
    });

    res.json({ client: updatedClient });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ error: 'Failed to update client', details: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    let where = {
      id: req.params.id
    };

    if (user.accountType === 'business') {
      const organizationId = req.headers['x-organization-id'];
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }
      
      const membership = await OrganizationUser.findOne({
        where: { userId, organizationId }
      });
      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      // For business accounts: show ALL organization data
      where.organizationId = organizationId;
    } else {
      // For individual accounts: show only user's data
      where.userId = userId;
    }

    // Check for associated invoices and contracts
    const client = await Client.findOne({
      where,
      include: [
        {
          model: Invoice,
          attributes: ['id'],
          required: false
        },
        {
          model: Contract,
          attributes: ['id'],
          required: false
        }
      ]
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (client.Invoices?.length || client.Contracts?.length) {
      return res.status(409).json({
        error: 'Cannot delete client with associated invoices or contracts',
        invoices: client.Invoices?.length || 0,
        contracts: client.Contracts?.length || 0
      });
    }

    await client.destroy();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({ error: 'Failed to delete client', details: error.message });
  }
};

exports.searchClients = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);
    let where = {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } },
        { companyName: { [Op.like]: `%${query}%` } }
      ]
    };

    if (user.accountType === 'business') {
      const organizationId = req.headers['x-organization-id'];
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }
      
      const membership = await OrganizationUser.findOne({
        where: { userId, organizationId }
      });
      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      // For business accounts: show ALL organization data
      where.organizationId = organizationId;
    } else {
      // For individual accounts: show only user's data
      where.userId = userId;
    }

    const clients = await Client.findAll({
      where,
      include: [
        {
          model: Invoice,
          attributes: ['id', 'totalAmount', 'status', 'dueDate'],
          required: false
        },
        {
          model: Contract,
          attributes: ['id', 'status', 'startDate', 'endDate'],
          required: false
        }
      ],
      order: [['name', 'ASC']],
      limit: 10
    });

    res.json({ clients });
  } catch (error) {
    console.error('Error searching clients:', error);
    return res.status(500).json({ error: 'Failed to search clients', details: error.message });
  }
};

exports.getClients = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const clients = await Client.findAll({
      where: { organizationId: orgId },
      include: [
        {
          model: Project,
          attributes: ['id', 'status'],
          where: { status: 'ACTIVE' },
          required: false
        },
        {
          model: Invoice,
          attributes: ['id', 'totalAmount', 'status', 'dueDate', 'createdAt'],
          required: false
        },
        {
          model: Contract,
          attributes: ['id', 'status', 'startDate', 'endDate', 'createdAt'],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal('(SELECT COUNT(*) FROM "Projects" WHERE "Projects"."clientId" = "Client"."id" AND "Projects"."status" = \'ACTIVE\')'),
            'activeProjects'
          ],
          [
            sequelize.literal('(SELECT COALESCE(SUM("totalAmount"), 0) FROM "Invoices" WHERE "Invoices"."clientId" = "Client"."id")'),
            'totalRevenue'
          ]
        ]
      }
    });

    res.json(clients);
  } catch (err) {
    console.error('Error getting clients:', err);
    res.status(500).json({ error: 'Failed to get clients' });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const client = await Client.findOne({
      where: { id, organizationId: orgId },
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'status', 'startDate', 'endDate']
        },
        {
          model: Invoice,
          attributes: ['id', 'amount', 'status', 'dueDate']
        },
        {
          model: Contract,
          attributes: ['id', 'title', 'status', 'startDate', 'endDate']
        }
      ]
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    console.error('Error getting client:', err);
    res.status(500).json({ error: 'Failed to get client' });
  }
};

exports.getClientActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const activities = await Activity.findAll({
      where: {
        clientId: id,
        organizationId: orgId
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(activities);
  } catch (err) {
    console.error('Error getting client activity:', err);
    res.status(500).json({ error: 'Failed to get client activity' });
  }
};

exports.getClientAnalytics = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const analytics = {
      totalClients: await Client.count({ where: { organizationId: orgId } }),
      activeProjects: await Project.count({
        where: {
          organizationId: orgId,
          status: 'ACTIVE'
        }
      }),
      totalRevenue: await Invoice.sum('totalAmount', {
        where: {
          organizationId: orgId,
          status: 'PAID'
        }
      }) || 0,
      clientTypes: await Client.findAll({
        where: { organizationId: orgId },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      })
    };

    res.json(analytics);
  } catch (err) {
    console.error('Error getting client analytics:', err);
    res.status(500).json({ error: 'Failed to get client analytics' });
  }
};

exports.getClientProjects = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const projects = await Project.findAll({
      where: {
        clientId: id,
        organizationId: orgId
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(projects);
  } catch (err) {
    console.error('Error getting client projects:', err);
    res.status(500).json({ error: 'Failed to get client projects' });
  }
};

exports.getClientInvoices = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const invoices = await Invoice.findAll({
      where: {
        clientId: id,
        organizationId: orgId
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(invoices);
  } catch (err) {
    console.error('Error getting client invoices:', err);
    res.status(500).json({ error: 'Failed to get client invoices' });
  }
};

exports.getClientContracts = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const contracts = await Contract.findAll({
      where: {
        clientId: id,
        organizationId: orgId
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(contracts);
  } catch (err) {
    console.error('Error getting client contracts:', err);
    res.status(500).json({ error: 'Failed to get client contracts' });
  }
};

exports.searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const clients = await Client.findAll({
      where: {
        organizationId: orgId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: 10
    });

    res.json(clients);
  } catch (err) {
    console.error('Error searching clients:', err);
    res.status(500).json({ error: 'Failed to search clients' });
  }
};

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  getAllClients: exports.getAllClients,
  createClient: exports.createClient,
  getClient: exports.getClient,
  updateClient: exports.updateClient,
  deleteClient: exports.deleteClient,
  searchClients: exports.searchClients,
  getClients: exports.getClients,
  getClientById: exports.getClientById,
  getClientActivity: exports.getClientActivity,
  getClientAnalytics: exports.getClientAnalytics,
  getClientProjects: exports.getClientProjects,
  getClientInvoices: exports.getClientInvoices,
  getClientContracts: exports.getClientContracts
};
