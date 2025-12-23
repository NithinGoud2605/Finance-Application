const { User, OrganizationUser, Contract, Invoice } = require('../models');

// Define available roles and their permissions
const ROLES = {
  ADMIN: {
    name: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: ['manage_team', 'manage_roles', 'manage_settings', 'view_analytics', 'manage_contracts', 'manage_invoices']
  },
  MANAGER: {
    name: 'Manager',
    description: 'Can manage team members and view analytics',
    permissions: ['manage_team', 'view_analytics', 'manage_contracts', 'manage_invoices']
  },
  MEMBER: {
    name: 'Team Member',
    description: 'Basic access to assigned features',
    permissions: ['view_analytics', 'manage_contracts', 'manage_invoices']
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access to assigned features',
    permissions: ['view_analytics']
  }
};

exports.getRoles = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Return roles with their permissions
    res.json(Object.entries(ROLES).map(([key, role]) => ({
      id: key,
      ...role
    })));
  } catch (err) {
    console.error('Error getting roles:', err);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const members = await OrganizationUser.findAll({
      where: { organizationId: orgId },
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      }]
    });

    res.json(members.map(member => ({
      id: member.User.id,
      email: member.User.email,
      firstName: member.User.firstName,
      lastName: member.User.lastName,
      role: member.User.role,
      joinedAt: member.createdAt
    })));
  } catch (err) {
    console.error('Error getting team members:', err);
    res.status(500).json({ error: 'Failed to get team members' });
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const member = await OrganizationUser.findOne({
      where: { 
        userId: id,
        organizationId: orgId
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await member.update({ role });
    res.json({ message: 'Team member updated successfully' });
  } catch (err) {
    console.error('Error updating team member:', err);
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const member = await OrganizationUser.findOne({
      where: { 
        userId: id,
        organizationId: orgId
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await member.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Error removing team member:', err);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};

exports.getMemberPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Get member's contracts and invoices
    const contracts = await Contract.findAll({
      where: { 
        userId: id,
        organizationId: orgId
      },
      attributes: ['id', 'status', 'value', 'createdAt']
    });

    const invoices = await Invoice.findAll({
      where: { 
        userId: id,
        organizationId: orgId
      },
      attributes: ['id', 'status', 'amount', 'createdAt']
    });

    // Calculate performance metrics
    const performance = {
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
      totalContractValue: contracts.reduce((sum, c) => sum + (c.value || 0), 0),
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'PAID').length,
      totalInvoiceAmount: invoices.reduce((sum, i) => sum + (i.amount || 0), 0),
      recentActivity: [
        ...contracts.map(c => ({
          type: 'contract',
          id: c.id,
          status: c.status,
          value: c.value,
          date: c.createdAt
        })),
        ...invoices.map(i => ({
          type: 'invoice',
          id: i.id,
          status: i.status,
          amount: i.amount,
          date: i.createdAt
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 10)
    };

    res.json(performance);
  } catch (err) {
    console.error('Error getting member performance:', err);
    res.status(500).json({ error: 'Failed to get member performance' });
  }
};

exports.getTeamAnalytics = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Get all team members
    const members = await OrganizationUser.findAll({
      where: { organizationId: orgId },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    // Get all contracts and invoices for the organization
    const contracts = await Contract.findAll({
      where: { organizationId: orgId },
      attributes: ['id', 'status', 'value', 'userId', 'createdAt']
    });

    const invoices = await Invoice.findAll({
      where: { organizationId: orgId },
      attributes: ['id', 'status', 'amount', 'userId', 'createdAt']
    });

    // Calculate team-wide metrics
    const teamAnalytics = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.User.role !== 'INACTIVE').length,
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
      totalContractValue: contracts.reduce((sum, c) => sum + (c.value || 0), 0),
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'PAID').length,
      totalInvoiceAmount: invoices.reduce((sum, i) => sum + (i.amount || 0), 0),
      memberStats: members.map(member => {
        const memberContracts = contracts.filter(c => c.userId === member.User.id);
        const memberInvoices = invoices.filter(i => i.userId === member.User.id);
        
        return {
          id: member.User.id,
          name: `${member.User.firstName} ${member.User.lastName}`,
          role: member.User.role,
          contracts: {
            total: memberContracts.length,
            active: memberContracts.filter(c => c.status === 'ACTIVE').length,
            value: memberContracts.reduce((sum, c) => sum + (c.value || 0), 0)
          },
          invoices: {
            total: memberInvoices.length,
            paid: memberInvoices.filter(i => i.status === 'PAID').length,
            amount: memberInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)
          }
        };
      }),
      recentActivity: [
        ...contracts.map(c => ({
          type: 'contract',
          id: c.id,
          status: c.status,
          value: c.value,
          userId: c.userId,
          date: c.createdAt
        })),
        ...invoices.map(i => ({
          type: 'invoice',
          id: i.id,
          status: i.status,
          amount: i.amount,
          userId: i.userId,
          date: i.createdAt
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 20)
    };

    res.json(teamAnalytics);
  } catch (err) {
    console.error('Error getting team analytics:', err);
    res.status(500).json({ error: 'Failed to get team analytics' });
  }
};

exports.inviteTeamMember = async (req, res) => {
  try {
    const { email, role, firstName, lastName } = req.body;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email,
        firstName,
        lastName,
        role: role || 'MEMBER',
        status: 'PENDING'
      });
    }

    // Check if user is already a member
    const existingMember = await OrganizationUser.findOne({
      where: {
        userId: user.id,
        organizationId: orgId
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Create organization membership
    const member = await OrganizationUser.create({
      userId: user.id,
      organizationId: orgId,
      role: role || 'MEMBER',
      status: 'PENDING'
    });

    // TODO: Send invitation email
    // This would typically involve:
    // 1. Generating a secure invitation token
    // 2. Creating an invitation record
    // 3. Sending an email with the invitation link

    res.status(201).json({
      message: 'Invitation sent successfully',
      member: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: member.role,
        status: member.status
      }
    });
  } catch (err) {
    console.error('Error inviting team member:', err);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
};

exports.updateMemberPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Valid permissions array is required' });
    }

    // Find the organization membership
    const member = await OrganizationUser.findOne({
      where: {
        userId: id,
        organizationId: orgId
      },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Update permissions
    await member.update({ permissions });

    res.json({
      message: 'Member permissions updated successfully',
      member: {
        id: member.User.id,
        firstName: member.User.firstName,
        lastName: member.User.lastName,
        role: member.User.role,
        permissions: member.permissions
      }
    });
  } catch (err) {
    console.error('Error updating member permissions:', err);
    res.status(500).json({ error: 'Failed to update member permissions' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    if (!role || !ROLES[role]) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    // Find the organization membership
    const member = await OrganizationUser.findOne({
      where: {
        userId: id,
        organizationId: orgId
      },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Update role
    await member.update({ role });

    // Update user's role if needed
    if (member.User.role !== role) {
      await member.User.update({ role });
    }

    res.json({
      message: 'Member role updated successfully',
      member: {
        id: member.User.id,
        firstName: member.User.firstName,
        lastName: member.User.lastName,
        role: role,
        permissions: ROLES[role].permissions
      }
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  }
}; 