const { Invoice, Contract, Client, Document, User, Payment } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errorHandler');
const sequelize = require('sequelize');

// Get overall analytics overview
exports.getOverview = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);

    const [
      totalRevenue,
      totalInvoices,
      totalContracts,
      totalClients,
      monthlyStats
    ] = await Promise.all([
      Invoice.sum('totalAmount', {
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Invoice.count({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Contract.count({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Client.count({
        where: {
          organizationId: orgId
        }
      }),
      getMonthlyStats(orgId, timeRange)
    ]);

    // Calculate growth rate
    const previousPeriodStats = await getPreviousPeriodStats(orgId, timeRange);
    const growthRate = calculateGrowthRate(totalRevenue, previousPeriodStats.totalRevenue);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue || 0,
        totalInvoices,
        totalContracts,
        totalClients,
        growthRate,
        monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed analytics report
exports.getReport = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH', type } = req.query;

    const dateFilter = getDateFilter(timeRange);

    let report;
    switch (type) {
      case 'invoices':
        report = await getInvoiceReport(orgId, dateFilter);
        break;
      case 'clients':
        report = await getClientReport(orgId, dateFilter);
        break;
      case 'documents':
        report = await getDocumentReport(orgId, dateFilter);
        break;
      default:
        report = await getFullReport(orgId, dateFilter);
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// Export analytics data
exports.exportAnalytics = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { format = 'csv', timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);
    const report = await getFullReport(orgId, dateFilter);

    // Convert to requested format
    let exportData;
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
        break;
      case 'json':
        exportData = JSON.stringify(report, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.json');
        break;
      default:
        throw new AppError('Unsupported export format', 'INVALID_FORMAT', 400);
    }

    res.send(exportData);
  } catch (error) {
    next(error);
  }
};

// Get invoice analytics overview
exports.getInvoiceOverview = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);

    const [
      totalAmount,
      totalCount,
      paidCount,
      pendingCount,
      overdueCount,
      monthlyStats
    ] = await Promise.all([
      Invoice.sum('totalAmount', {
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Invoice.count({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Invoice.count({
        where: {
          organizationId: orgId,
          status: 'PAID',
          createdAt: dateFilter
        }
      }),
      Invoice.count({
        where: {
          organizationId: orgId,
          status: 'PENDING',
          createdAt: dateFilter
        }
      }),
      Invoice.count({
        where: {
          organizationId: orgId,
          status: 'OVERDUE',
          createdAt: dateFilter
        }
      }),
      getMonthlyStats(orgId, timeRange)
    ]);

    res.json({
      success: true,
      data: {
        totalAmount: totalAmount || 0,
        totalCount,
        paidCount,
        pendingCount,
        overdueCount,
        monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get invoice report
exports.getInvoiceReport = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;
    const dateFilter = getDateFilter(timeRange);
    const report = await getInvoiceReportData(orgId, dateFilter);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// Get client statistics
exports.getClientStats = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);

    const [
      totalClients,
      activeClients,
      newClients,
      topClients
    ] = await Promise.all([
      Client.count({
        where: {
          organizationId: orgId
        }
      }),
      Client.count({
        where: {
          organizationId: orgId,
          status: 'ACTIVE'
        }
      }),
      Client.count({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      getTopClients(orgId, dateFilter)
    ]);

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        newClients,
        topClients
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get document analytics
exports.getDocumentAnalytics = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);

    const [
      totalDocuments,
      totalSize,
      byType,
      byFolder
    ] = await Promise.all([
      Document.count({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Document.sum('size', {
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Document.findAll({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      }),
      Document.findAll({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        },
        attributes: [
          'folder',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['folder']
      })
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments,
        totalSize: totalSize || 0,
        byType,
        byFolder
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get team analytics
exports.getTeamAnalytics = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);

    const [
      totalMembers,
      activeMembers,
      memberPerformance
    ] = await Promise.all([
      User.count({
        where: {
          organizationId: orgId
        }
      }),
      User.count({
        where: {
          organizationId: orgId,
          status: 'ACTIVE'
        }
      }),
      getMemberPerformance(orgId, dateFilter)
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        memberPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get payment analytics
exports.getPaymentAnalytics = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { timeRange = 'THIS_MONTH' } = req.query;

    const dateFilter = getDateFilter(timeRange);

    const [
      totalPayments,
      totalAmount,
      byMethod,
      byStatus
    ] = await Promise.all([
      Payment.count({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Payment.sum('amount', {
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        }
      }),
      Payment.findAll({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        },
        attributes: [
          'method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        group: ['method']
      }),
      Payment.findAll({
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        group: ['status']
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPayments,
        totalAmount: totalAmount || 0,
        byMethod,
        byStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getDateFilter(timeRange) {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case 'THIS_MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'LAST_MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'THIS_QUARTER':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'THIS_YEAR':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'LAST_YEAR':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    [Op.gte]: startDate,
    [Op.lte]: now
  };
}

async function getMonthlyStats(orgId, timeRange) {
  const months = [];
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case 'THIS_MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'LAST_MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'THIS_QUARTER':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'THIS_YEAR':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'LAST_YEAR':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const currentDate = new Date(startDate);
  while (currentDate <= now) {
    months.push({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth()
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const stats = await Promise.all(
    months.map(async ({ year, month }) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      const [totalAmount, totalCount] = await Promise.all([
        Invoice.sum('totalAmount', {
          where: {
            organizationId: orgId,
            createdAt: {
              [Op.between]: [start, end]
            }
          }
        }),
        Invoice.count({
          where: {
            organizationId: orgId,
            createdAt: {
              [Op.between]: [start, end]
            }
          }
        })
      ]);

      return {
        year,
        month,
        totalAmount: totalAmount || 0,
        totalCount
      };
    })
  );

  return stats;
}

async function getPreviousPeriodStats(orgId, timeRange) {
  const now = new Date();
  let startDate, endDate;

  switch (timeRange) {
    case 'THIS_MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'LAST_MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      break;
    case 'THIS_QUARTER':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
      endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
      break;
    case 'THIS_YEAR':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    case 'LAST_YEAR':
      startDate = new Date(now.getFullYear() - 2, 0, 1);
      endDate = new Date(now.getFullYear() - 2, 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  const totalRevenue = await Invoice.sum('totalAmount', {
    where: {
      organizationId: orgId,
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    }
  });

  return {
    totalRevenue: totalRevenue || 0
  };
}

function calculateGrowthRate(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

async function getTopClients(orgId, dateFilter) {
  return await Invoice.findAll({
    where: {
      organizationId: orgId,
      createdAt: dateFilter
    },
    attributes: [
      'clientId',
      [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount']
    ],
    include: [{
      model: Client,
      attributes: ['name']
    }],
    group: ['clientId', 'Client.id'],
    order: [[sequelize.literal('totalAmount'), 'DESC']],
    limit: 10
  });
}

async function getMemberPerformance(orgId, dateFilter) {
  return await Invoice.findAll({
    where: {
      organizationId: orgId,
      createdAt: dateFilter
    },
    attributes: [
      'userId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount'],
      [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount']
    ],
    include: [{
      model: User,
      attributes: ['name', 'email']
    }],
    group: ['userId', 'User.id'],
    order: [[sequelize.literal('totalAmount'), 'DESC']]
  });
}

function convertToCSV(data) {
  // Implementation for converting data to CSV format
  // This is a placeholder - implement based on your needs
  return JSON.stringify(data);
}

// Internal helper functions
async function getInvoiceReportData(orgId, dateFilter) {
  const [
    totalAmount,
    totalCount,
    byStatus,
    byMonth,
    topClients
  ] = await Promise.all([
    Invoice.sum('totalAmount', {
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      }
    }),
    Invoice.count({
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      }
    }),
    Invoice.findAll({
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      group: ['status']
    }),
    getMonthlyStats(orgId, dateFilter),
    getTopClients(orgId, dateFilter)
  ]);

  return {
    totalAmount: totalAmount || 0,
    totalCount,
    byStatus,
    byMonth,
    topClients
  };
}

async function getClientReportData(orgId, dateFilter) {
  const [
    totalClients,
    activeClients,
    newClients,
    byStatus,
    topClients
  ] = await Promise.all([
    Client.count({
      where: {
        organizationId: orgId
      }
    }),
    Client.count({
      where: {
        organizationId: orgId,
        status: 'ACTIVE'
      }
    }),
    Client.count({
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      }
    }),
    Client.findAll({
      where: {
        organizationId: orgId
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    }),
    getTopClients(orgId, dateFilter)
  ]);

  return {
    totalClients,
    activeClients,
    newClients,
    byStatus,
    topClients
  };
}

async function getDocumentReportData(orgId, dateFilter) {
  const [
    totalDocuments,
    totalSize,
    byType,
    byFolder,
    byMonth
  ] = await Promise.all([
    Document.count({
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      }
    }),
    Document.sum('size', {
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      }
    }),
    Document.findAll({
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
      ],
      group: ['type']
    }),
    Document.findAll({
      where: {
        organizationId: orgId,
        createdAt: dateFilter
      },
      attributes: [
        'folder',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
      ],
      group: ['folder']
    }),
    getMonthlyStats(orgId, dateFilter)
  ]);

  return {
    totalDocuments,
    totalSize: totalSize || 0,
    byType,
    byFolder,
    byMonth
  };
}

async function getFullReportData(orgId, dateFilter) {
  const [
    invoiceReport,
    clientReport,
    documentReport,
    teamReport,
    paymentReport
  ] = await Promise.all([
    getInvoiceReportData(orgId, dateFilter),
    getClientReportData(orgId, dateFilter),
    getDocumentReportData(orgId, dateFilter),
    getTeamAnalytics(orgId, dateFilter),
    getPaymentAnalytics(orgId, dateFilter)
  ]);

  return {
    invoices: invoiceReport,
    clients: clientReport,
    documents: documentReport,
    team: teamReport,
    payments: paymentReport
  };
} 