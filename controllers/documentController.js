const { Document, User, OrganizationActivity, DocumentVersion, DocumentShare, DocumentFolder } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const sequelize = require('sequelize');
const { uploadToS3, deleteFromS3, getPreSignedUrl, downloadFile } = require('../utils/s3Uploader');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type', 'INVALID_FILE_TYPE', 400));
    }
  }
}).single('file');

// Upload document
exports.uploadDocument = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      if (!req.file) {
        throw new AppError('No file uploaded', 'NO_FILE', 400);
      }

      const orgId = req.headers['x-organization-id'] || req.context?.orgId;
      const userId = req.user?.id || req.context?.userId;
      const { name, type, tags, isTemplate, templateCategory } = req.body;

      // Upload to Supabase Storage
      const fileKey = `documents/${orgId}/${Date.now()}-${req.file.originalname}`;
      const uploadResult = await uploadToS3(req.file.buffer, fileKey, req.file.mimetype);

      // Create document record (store key, not full URL)
      const document = await Document.create({
        organizationId: orgId,
        userId,
        name: name || req.file.originalname,
        type,
        fileUrl: fileKey, // Store only the key, never full URL
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        tags: tags ? JSON.parse(tags) : [],
        isTemplate: isTemplate === 'true',
        templateCategory
      });

      // Log activity
      if (orgId) {
        await OrganizationActivity.create({
          organizationId: orgId,
          userId,
          type: isTemplate === 'true' ? 'TEMPLATE_CREATED' : 'DOCUMENT_CREATED',
          entityType: 'DOCUMENT',
          entityId: document.id,
          metadata: {
            documentName: document.name,
            documentType: document.type
          }
        });
      }

      // Create initial version
      await DocumentVersion.create({
        documentId: document.id,
        version: 1,
        path: fileKey
      });

      res.status(201).json({
        success: true,
        data: document
      });
    });
  } catch (error) {
    next(error);
  }
};

// Get documents
exports.getDocuments = async (req, res, next) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const { search, type, date, folder } = req.query;
    const where = { organizationId: orgId };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (folder && folder !== 'ALL') {
      where.folder = folder;
    }

    if (date && date !== 'ALL') {
      const now = new Date();
      let startDate;

      switch (date) {
        case 'TODAY':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'WEEK':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'MONTH':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      where.createdAt = { [Op.gte]: startDate };
    }

    const documents = await Document.findAll({
      where,
      include: [
        {
          model: DocumentFolder,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// Get document by ID
exports.getDocumentById = async (req, res, next) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.context?.orgId;
    const { id } = req.params;

    const document = await Document.findOne({
      where: {
        id,
        organizationId: orgId
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!document) {
      throw new AppError('Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Update document
exports.updateDocument = async (req, res, next) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.context?.orgId;
    const userId = req.user?.id || req.context?.userId;
    const { documentId } = req.params;
    const { name, status, tags } = req.body;

    const document = await Document.findOne({
      where: {
        id: documentId,
        organizationId: orgId
      }
    });

    if (!document) {
      throw new AppError('Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    // Create new version if file is uploaded
    if (req.file) {
      const fileKey = `documents/${orgId}/${Date.now()}-${req.file.originalname}`;
      await uploadToS3(req.file.buffer, fileKey, req.file.mimetype);

      // Create new version (store key, not full URL)
      const newVersion = await Document.create({
        ...document.toJSON(),
        id: undefined,
        parentId: document.id,
        version: document.version + 1,
        fileUrl: fileKey, // Store only key, never full URL
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        name: name || document.name,
        status: status || document.status,
        tags: tags ? JSON.parse(tags) : document.tags
      });

      // Log activity
      if (orgId) {
        await OrganizationActivity.create({
          organizationId: orgId,
          userId,
          type: 'DOCUMENT_UPDATED',
          entityType: 'DOCUMENT',
          entityId: newVersion.id,
          metadata: {
            documentName: newVersion.name,
            documentType: newVersion.type,
            version: newVersion.version
          }
        });
      }

      return res.json({
        success: true,
        data: newVersion
      });
    }

    // Update existing version
    await document.update({
      name: name || document.name,
      status: status || document.status,
      tags: tags ? JSON.parse(tags) : document.tags
    });

    // Log activity
    if (orgId) {
      await OrganizationActivity.create({
        organizationId: orgId,
        userId,
        type: 'DOCUMENT_UPDATED',
        entityType: 'DOCUMENT',
        entityId: document.id,
        metadata: {
          documentName: document.name,
          documentType: document.type
        }
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Delete document
exports.deleteDocument = async (req, res, next) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.context?.orgId;
    const userId = req.user?.id || req.context?.userId;
    const { documentId } = req.params;

    const document = await Document.findOne({
      where: {
        id: documentId,
        organizationId: orgId
      }
    });

    if (!document) {
      throw new AppError('Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    // Delete from storage if fileUrl exists
    if (document.fileUrl) {
      try {
        await deleteFromS3(document.fileUrl);
      } catch (storageError) {
        logger.error('Failed to delete file from storage:', storageError);
        // Continue with archiving even if storage delete fails
      }
    }

    // Archive document
    await document.update({ status: 'ARCHIVED' });

    // Log activity
    if (orgId) {
      await OrganizationActivity.create({
        organizationId: orgId,
        userId,
        type: 'DOCUMENT_ARCHIVED',
        entityType: 'DOCUMENT',
        entityId: document.id,
        metadata: {
          documentName: document.name,
          documentType: document.type
        }
      });
    }

    res.json({
      success: true,
      message: 'Document archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get document versions
exports.getDocumentVersions = async (req, res, next) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.context?.orgId;
    const { documentId } = req.params;

    const versions = await DocumentVersion.findAll({
      where: {
        [Op.or]: [
          { id: documentId },
          { parentId: documentId }
        ],
        organizationId: orgId
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['version', 'DESC']]
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

exports.shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];
    const { email, permissions } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const document = await Document.findOne({
      where: { id, organizationId: orgId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const share = await DocumentShare.create({
      documentId: id,
      email,
      permissions,
      organizationId: orgId
    });

    res.status(201).json(share);
  } catch (err) {
    console.error('Error sharing document:', err);
    res.status(500).json({ error: 'Failed to share document' });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const document = await Document.findOne({
      where: { id, organizationId: orgId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.fileUrl) {
      return res.status(404).json({ error: 'Document file not found' });
    }

    // Download from Supabase Storage
    const fileBuffer = await downloadFile(document.fileUrl);
    
    res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

exports.getDocumentAnalytics = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const analytics = {
      totalDocuments: await Document.count({ where: { organizationId: orgId } }),
      totalSize: await Document.sum('size', { where: { organizationId: orgId } }) || 0,
      byType: await Document.findAll({
        where: { organizationId: orgId },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      }),
      byFolder: await Document.findAll({
        where: { organizationId: orgId },
        attributes: [
          'folder',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['folder']
      })
    };

    res.json(analytics);
  } catch (err) {
    console.error('Error getting document analytics:', err);
    res.status(500).json({ error: 'Failed to get document analytics' });
  }
};

exports.getDocumentFolders = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const folders = await DocumentFolder.findAll({
      where: { organizationId: orgId },
      include: [{
        model: Document,
        attributes: ['id'],
        required: false
      }],
      attributes: {
        include: [
          [
            sequelize.literal('(SELECT COUNT(*) FROM "Documents" WHERE "Documents"."folderId" = "DocumentFolder"."id")'),
            'documentCount'
          ]
        ]
      }
    });

    res.json(folders);
  } catch (err) {
    console.error('Error getting document folders:', err);
    res.status(500).json({ error: 'Failed to get document folders' });
  }
};

exports.createDocumentFolder = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const folder = await DocumentFolder.create({
      ...req.body,
      organizationId: orgId
    });

    res.status(201).json(folder);
  } catch (err) {
    console.error('Error creating document folder:', err);
    res.status(500).json({ error: 'Failed to create document folder' });
  }
};

exports.updateDocumentFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const folder = await DocumentFolder.findOne({
      where: { id, organizationId: orgId }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    await folder.update(req.body);
    res.json(folder);
  } catch (err) {
    console.error('Error updating document folder:', err);
    res.status(500).json({ error: 'Failed to update document folder' });
  }
};

exports.deleteDocumentFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const folder = await DocumentFolder.findOne({
      where: { id, organizationId: orgId },
      include: [{
        model: Document,
        attributes: ['id'],
        required: false
      }]
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (folder.Documents?.length > 0) {
      return res.status(409).json({
        error: 'Cannot delete folder with documents',
        documentCount: folder.Documents.length
      });
    }

    await folder.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting document folder:', err);
    res.status(500).json({ error: 'Failed to delete document folder' });
  }
};
