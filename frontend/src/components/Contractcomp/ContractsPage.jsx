import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  Container,
  Paper,
  Divider,
  CircularProgress,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Swal from 'sweetalert2';
import {
  getAllContracts,
  getContractPdf,
  deleteContract,
  updateContract,
  uploadContract,
  createContract,
  getAllClients,
  sendContract,
} from '../../services/api';
import ContractsTotalsChart from './TotalsChart';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Add custom styles for SweetAlert
const customSwalStyles = `
  .swal-wide {
    width: 600px !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = customSwalStyles;
  document.head.appendChild(styleSheet);
}

// Components
import UploadContractModal from './UploadContractModal';
import MissingInfoModal from './MissingInfoModal';
import SendEmailDialog from '../common/SendEmailDialog';
import EditContractModal from './EditContractModal';

// Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import ArchiveIcon from '@mui/icons-material/Archive';
import TimerIcon from '@mui/icons-material/Timer';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CachedIcon from '@mui/icons-material/Cached';
import WorkIcon from '@mui/icons-material/Work';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import CloudIcon from '@mui/icons-material/Cloud';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const MotionCard = motion.create(Card);
const MotionPaper = motion.create(Paper);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const statusColors = {
  // Uppercase variants
  DRAFT: 'warning',
  PENDING_REVIEW: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'error',
  TERMINATED: 'error',
  ARCHIVED: 'default',
  COMPLETED: 'success',
  SIGNED: 'success',
  CANCELLED: 'error',
  PENDING: 'warning',
  // Lowercase variants
  draft: 'warning',
  pending_review: 'warning',
  pending: 'warning',
  active: 'success',
  expired: 'error',
  terminated: 'error',
  archived: 'default',
  sent: 'info',
  signed: 'success',
  completed: 'success',
  cancelled: 'error',
};

const statusIcons = {
  // Uppercase variants
  DRAFT: EditIcon,
  PENDING_REVIEW: PendingIcon,
  ACTIVE: CheckCircleIcon,
  EXPIRED: ErrorIcon,
  TERMINATED: ErrorIcon,
  ARCHIVED: ArchiveIcon,
  COMPLETED: CheckCircleIcon,
  SIGNED: CheckCircleIcon,
  CANCELLED: ErrorIcon,
  PENDING: PendingIcon,
  // Lowercase variants
  draft: EditIcon,
  pending_review: PendingIcon,
  pending: PendingIcon,
  active: CheckCircleIcon,
  expired: ErrorIcon,
  terminated: ErrorIcon,
  archived: ArchiveIcon,
  sent: TimerIcon,
  signed: CheckCircleIcon,
  completed: CheckCircleIcon,
  cancelled: ErrorIcon,
};

export default function ContractsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  
  // Map frontend contract types to backend enum values (for legacy support)
  const mapContractType = (frontendType) => {
    // If it's already a valid backend enum value, return it as-is
    const validBackendTypes = [
      'service_agreement', 'fixed_price', 'time_and_materials', 'retainer', 'other',
      'consulting', 'employment', 'nda', 'partnership', 'freelance', 'maintenance', 
      'license', 'vendor_agreement', 'software_license', 'saas_agreement',
      'consulting_retainer', 'subscription', 'non_disclosure'
    ];
    
    if (validBackendTypes.includes(frontendType)) {
      return frontendType;
    }
    
    // Legacy mapping for old uppercase values
    const mapping = {
      'SERVICE_AGREEMENT': 'service_agreement',
      'CONSULTING': 'consulting',
      'EMPLOYMENT': 'employment', 
      'NDA': 'nda',
      'FREELANCE': 'freelance',
      'MAINTENANCE': 'maintenance',
      'LICENSE': 'license',
      'PARTNERSHIP': 'partnership',
      'VENDOR': 'vendor_agreement',
      'OTHER': 'other',
      'FIXED_PRICE': 'fixed_price',
      'TIME_AND_MATERIALS': 'time_and_materials',
      'RETAINER': 'retainer'
    };
    return mapping[frontendType] || 'service_agreement';
  };

  // Contract type display mapping
  const contractTypeLabels = {
    'service_agreement': 'Service Agreement',
    'fixed_price': 'Fixed Price',
    'time_and_materials': 'Time & Materials',
    'retainer': 'Retainer',
    'consulting': 'Consulting',
    'employment': 'Employment',
    'nda': 'Non-Disclosure Agreement',
    'non_disclosure': 'Confidentiality Agreement',
    'partnership': 'Partnership',
    'freelance': 'Freelance',
    'maintenance': 'Maintenance',
    'license': 'License Agreement',
    'vendor_agreement': 'Vendor Agreement',
    'software_license': 'Software License',
    'saas_agreement': 'SaaS Agreement',
    'consulting_retainer': 'Consulting Retainer',
    'subscription': 'Subscription',
    'other': 'Other'
  };

  // Contract type icons
  const contractTypeIcons = {
    'service_agreement': HandshakeIcon,
    'fixed_price': WorkIcon,
    'time_and_materials': TimerIcon,
    'retainer': CachedIcon,
    'consulting': HandshakeIcon,
    'employment': PersonIcon,
    'nda': SecurityIcon,
    'non_disclosure': SecurityIcon,
    'partnership': HandshakeIcon,
    'freelance': PersonIcon,
    'maintenance': BuildIcon,
    'license': AssignmentIcon,
    'vendor_agreement': BusinessIcon,
    'software_license': CodeIcon,
    'saas_agreement': CloudIcon,
    'consulting_retainer': HandshakeIcon,
    'subscription': SubscriptionsIcon,
    'other': AssignmentIcon
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState('');
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
      const [currentView, setCurrentView] = useState('list');

  // PDF preview states
  const [pdfPreviews, setPdfPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState({});

  // Theme-aware form field styling
  const getFormFieldSx = () => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(20px)',
      borderRadius: 2,
      border: `1px solid ${theme.palette.mode === 'light' 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(255, 255, 255, 0.1)'}`,
      '& fieldset': {
        borderColor: 'transparent',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(103, 126, 234, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: '#667eea',
      },
    },
  });

  // Fetch contracts with React Query
  const { 
    data: contracts, 
    isLoading, 
    error,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['contracts', statusFilter, dateFilter, sortBy],
    queryFn: () => getAllContracts({ status: statusFilter, date: dateFilter, sort: sortBy }),
    enabled: !!user,
    select: (data) => data.contracts || data || [],
  });

  // Fetch clients for missing info modal
  const {
    data: clientsData,
    isLoading: clientsLoading,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getAllClients(),
    select: (data) => data.clients,
    enabled: !!user,
  });

  // Prepare data
  const existingClients = clientsData || [];

  // Delete mutation
  const deleteContractMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      console.error('Error deleting contract:', error);
    }
  });

  // Update mutation
  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }) => updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
    },
    onError: (error) => {
      console.error('Error updating contract:', error);
    }
  });

  // Upload and missing field handlers - exact same pattern as invoices
  // Helper function to safely handle file keys (no S3 URL processing)
  const sanitizeFileKey = (key) => {
    if (!key) return key;
    // Only return the key itself, never process S3 URLs
    return typeof key === 'string' ? key : '';
  };

  const handleMissingFields = (fields, fileKey = null) => {
    setMissingFields(fields);
    setUploadedFileKey(fileKey);
    setModalOpen(true);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name, file.type, file.size);
      console.log('FormData contents:', formData.get('file'));
      const result = await uploadContract(formData);
      console.log('Upload result:', result);
      
      // Handle the actual backend response format
      if (result && typeof result === 'object') {
        // Check if the upload requires completion (missing fields)
        if (result.requiresCompletion && result.missingFields && Array.isArray(result.missingFields) && result.missingFields.length > 0) {
          console.log('Missing fields detected:', result.missingFields);
          console.log('Uploaded file key:', result.uploadedFileKey);
          handleMissingFields(result.missingFields, result.uploadedFileKey);
          
          // Show success message for file upload
          Swal.fire({
            icon: 'info',
            title: 'File Uploaded!',
            text: result.message || 'Please complete the missing contract information.',
            confirmButtonText: 'Complete Information'
          });
        } else if (result.success && result.contractId) {
          // Contract was created successfully
          console.log('Contract created from upload:', result.contractId);
          
          // Refresh the contracts list
          refetchContracts();
          
          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: result.message || 'Contract created successfully from uploaded file.',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } else if (result.success !== false) {
          // Fallback for successful upload responses
          console.log('Upload successful:', result);
          
          // Refresh the contracts list since contract was likely created
          refetchContracts();
          
          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Upload Complete!',
            text: result.message || 'Contract uploaded and created successfully.',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } else {
          // Explicit failure or unexpected response format
          console.warn('Upload failed or unexpected response:', result);
          Swal.fire({
            icon: 'warning',
            title: 'Upload Issue',
            text: result.message || result.error || 'File upload completed but with unexpected response format.',
            confirmButtonText: 'OK'
          });
        }
      } else {
        // Non-object response
        console.warn('Unexpected upload response type:', typeof result, result);
        Swal.fire({
          icon: 'warning',
          title: 'Upload Complete',
          text: 'File uploaded but response format was unexpected.',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.error || error.message || 'Failed to upload file. Please try again.',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMissingInfoSubmit = async (data) => {
    try {
      console.log('Creating contract with missing info data:', data);
      console.log('Uploaded file key:', uploadedFileKey);
      console.log('User info:', { 
        id: user.id, 
        accountType: user.accountType, 
        defaultOrganizationId: user.defaultOrganizationId 
      });
      
      // Map and prepare contract data for backend
      const contractData = {
        // Note: accountType and userId are set by backend, don't send them
        
        // Basic contract information
        title: data.title,
        contractType: mapContractType(data.contractType), // Map to valid backend enum
        startDate: data.startDate,
        endDate: data.endDate,
        value: data.contractValue || data.value || 0, // Use 'value' field name as expected by backend model
        
        // Client information - format expected by backend
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.newClient && { 
          client: {
            name: data.newClient.name,
            email: data.newClient.email,
            phone: data.newClient.phone || '',
            address: data.newClient.address || '',
            city: data.newClient.city || '',
            state: data.newClient.state || '',
            zipCode: data.newClient.zipCode || '',
            country: data.newClient.country || '',
            companyName: data.newClient.companyName || ''
          }
        }),
        
        // Contract terms and conditions
        description: data.description || '',
        terms: data.terms || '',
        paymentTerms: data.paymentTerms || '',
        terminationClause: data.terminationClause || '',
        
        // Billing and renewal information
        billingFrequency: data.billingFrequency || null,
        autoRenew: data.autoRenew || false,
        renewalTerms: data.renewalTerms || {
          duration: 365,
          priceAdjustment: 0,
          notificationDays: [30, 15, 7]
        },
        
        // Project information
        departmentCode: data.departmentCode || '',
        projectCode: data.projectCode || '',
        
        // File upload information - prioritize pdfUrl for new contracts
        ...(uploadedFileKey && { 
          pdfUrl: uploadedFileKey, // Primary field for PDF storage
          contractUrl: uploadedFileKey // Keep for legacy compatibility
        }),
        
        // Default values - use lowercase to match backend enum
        status: data.status || 'draft',
        currency: data.currency || 'USD'
        
        // Note: Removed ...data spread to prevent overriding corrected enum values
      };
      
      // Log the final contract data being sent
      console.log('Final contract data being sent to backend:', contractData);
      console.log('Contract data details:');
      console.log('- status:', contractData.status);
      console.log('- contractType:', contractData.contractType);
      console.log('- value:', contractData.value);
      console.log('- client info:', contractData.client || 'using clientId:', contractData.clientId);
      
      // Create the contract with the completed information
      const result = await createContract(contractData);
      console.log('Contract created:', result);
      
      // Close modal and refresh data
      setModalOpen(false);
      setMissingFields('');
      setUploadedFileKey(null);
      
      // Refresh the contracts list
      refetchContracts();
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Contract Created!',
        text: 'Contract has been created successfully with the uploaded file.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (error) {
      console.error('Error submitting missing info:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Extract specific error message
      let errorMessage = 'Failed to create contract. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleSortClick = (event) => {
    setSortAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchor(null);
  };

  const handleActionClick = (event, contract) => {
    setSelectedContract(contract);
    setActionAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedContract(null);
  };

  const handleContractAction = async (contract, action) => {
    switch (action) {
      case 'view':
        setSelectedContract(contract);
        setViewDetailsOpen(true);
        // Load PDF preview for the modal
        await loadPdfPreview(contract.id);
        break;
      case 'edit':
        // Open edit modal
        console.log('Opening edit modal for contract:', contract);
        setSelectedContract(contract);
        setEditModalOpen(true);
        return; // Exit early to avoid handleActionClose
      case 'delete':
        setSelectedContract(contract);
        setDeleteDialogOpen(true);
        return; // Exit early to avoid handleActionClose
      case 'download':
        try {
          const response = await getContractPdf(contract.id, 'download');
          if (response && response.url) {
            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = response.url;
            link.download = `contract-${contract.title || contract.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Swal.fire({
              title: 'Download Started',
              text: 'Your contract PDF is being downloaded.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            throw new Error('No PDF URL available');
          }
        } catch (error) {
          console.error('Error downloading contract:', error);
          
          // Check if it's a 404 error (no PDF available)
          if (error.response?.status === 404 || error.message?.includes('PDF not found')) {
            Swal.fire({
              title: 'No PDF Available',
              text: 'This contract was created without a PDF file. You can edit the contract to add one or generate a new PDF.',
              icon: 'info',
              confirmButtonColor: theme.palette.primary.main,
              showCancelButton: true,
              confirmButtonText: 'Generate PDF',
              cancelButtonText: 'Close'
            }).then((result) => {
              if (result.isConfirmed) {
                // Navigate to contract creation with pre-filled data
                navigate(`/contracts/create?edit=${contract.id}`);
              }
            });
          } else {
            Swal.fire({
              title: 'Download Failed',
              text: 'Unable to download the contract PDF. Please try again later.',
              icon: 'error',
              confirmButtonColor: theme.palette.primary.main,
            });
          }
        }
        break;
      case 'email':
        console.log('=== EMAIL ACTION TRIGGERED ===');
        console.log('Contract:', contract);
        setSelectedContract(contract);
        setEmailDialogOpen(true);
        console.log('Email dialog should be open now');
        return; // Exit early to avoid handleActionClose
      case 'print':
        // Implement print functionality
        try {
          const response = await getContractPdf(contract.id, 'view');
          if (response && response.url) {
            // Open the PDF in a new window for printing
            const printWindow = window.open(response.url, '_blank');
            if (printWindow) {
              printWindow.addEventListener('load', () => {
                printWindow.print();
              });
            }
          } else {
            throw new Error('No PDF URL available');
          }
        } catch (error) {
          console.error('Error printing contract:', error);
          Swal.fire({
            title: 'Print Failed',
            text: 'Unable to print the contract. The PDF may not be available.',
            icon: 'error',
            confirmButtonColor: theme.palette.primary.main,
          });
        }
        break;
      default:
        break;
    }
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedContract) {
      deleteContractMutation.mutate(selectedContract.id);
    }
  };

  // Handle edit contract submission
  const handleEditSubmit = async (data) => {
    try {
      await updateContractMutation.mutateAsync({
        id: selectedContract.id,
        data: data
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Contract Updated!',
        text: 'Contract details have been updated successfully.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      setEditModalOpen(false);
      setSelectedContract(null);
    } catch (error) {
      console.error('Error updating contract:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update contract. Please try again.',
        confirmButtonColor: theme.palette.primary.main,
      });
    }
  };

  // Handle sending contract email
  const handleSendEmail = async (emailData) => {
    try {
      // Debug logging
      console.log('=== CONTRACTS handleSendEmail START ===');
      console.log('Sending contract email with data:', {
        contractId: selectedContract.id,
          email: emailData.email,
        message: emailData.message,
        senderName: emailData.senderName,
        selectedContract: selectedContract,
        clientEmail: selectedContract?.client?.email,
        ClientEmail: selectedContract?.Client?.email
      });
      
      // Use the API service function which handles token refresh automatically
      const response = await sendContract(selectedContract.id, {
        email: emailData.email,
        message: emailData.message,
        senderName: emailData.senderName
      });
      
      console.log('Contract email API response:', response);

      // Refresh contracts to show updated status
      await refetchContracts();

      Swal.fire({
        icon: 'success',
        title: 'Email Sent!',
        text: `Contract has been sent to ${emailData.email}`,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      setEmailDialogOpen(false);
      setSelectedContract(null);
      console.log('=== CONTRACTS handleSendEmail SUCCESS ===');
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Handle specific error types
      if (error.code === 'SESSION_EXPIRED' || error.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'Your session has expired. Please sign in again.',
          confirmButtonText: 'Sign In',
        }).then(() => {
          window.location.href = '/sign-in';
        });
        return;
      }
      
      // Show error dialog instead of throwing
      Swal.fire({
        icon: 'error',
        title: 'Email Failed',
        text: error.message || 'Failed to send contract email. Please try again.',
        confirmButtonColor: theme.palette.primary.main,
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (contract, newStatus) => {
    try {
      await updateContractMutation.mutateAsync({
        id: contract.id,
        data: { status: newStatus }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: `Contract status changed to ${newStatus}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update contract status. Please try again.',
        confirmButtonColor: theme.palette.primary.main,
      });
    }
  };

  // Handle auto-renew toggle
  const handleAutoRenewToggle = async (contract) => {
    try {
      const newAutoRenew = !contract.autoRenew;
      await updateContractMutation.mutateAsync({
        id: contract.id,
        data: { autoRenew: newAutoRenew }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Auto-Renew Updated!',
        text: `Auto-renew is now ${newAutoRenew ? 'enabled' : 'disabled'}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update auto-renew setting. Please try again.',
        confirmButtonColor: theme.palette.primary.main,
      });
    }
  };

  // PDF Preview functions
  const loadPdfPreview = async (contractId) => {
    if (pdfPreviews[contractId] || loadingPreviews[contractId]) return;
    
    // First check if the contract has a PDF URL (check both pdfUrl and contractUrl)
    const contract = contracts.find(cont => cont.id === contractId);
    
    // Check both pdfUrl and contractUrl fields (legacy support)
    const hasPdfFile = contract && (contract.pdfUrl || contract.contractUrl);
    if (!contract || !hasPdfFile) {
      // Set as no PDF available instead of trying to load
      setPdfPreviews(prev => ({ ...prev, [contractId]: 'no-pdf' }));
      return;
    }
    
    setLoadingPreviews(prev => ({ ...prev, [contractId]: true }));
    
    try {
      const response = await getContractPdf(contractId, 'view');
      
      // Handle different response formats
      let pdfUrl;
      if (response.url) {
        // If the response contains a URL, use it directly
        pdfUrl = response.url;
      } else if (response instanceof Blob) {
        // If the response is a Blob, create object URL
        pdfUrl = URL.createObjectURL(response);
      } else {
        throw new Error('Invalid PDF response format');
      }
      
      setPdfPreviews(prev => ({ ...prev, [contractId]: pdfUrl }));
    } catch (error) {
      console.error('Error loading PDF preview:', error);
      
      // Check if it's a 404 error (no PDF available)
      if (error.response?.status === 404 || error.message?.includes('PDF not found')) {
        setPdfPreviews(prev => ({ ...prev, [contractId]: 'no-pdf' }));
      } else {
        // Set a placeholder or error state for other errors
        setPdfPreviews(prev => ({ ...prev, [contractId]: 'error' }));
      }
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [contractId]: false }));
    }
  };

  // PDF Preview Component
  const PDFPreview = ({ contractId, onLoad }) => {
    // A4 aspect ratio but smaller for card preview
    const containerStyle = {
      width: '100%',
      aspectRatio: '1 / 1.414', // Perfect A4 aspect ratio
      height: '180px', // Fixed height for consistent card preview
      overflow: 'hidden',
      borderRadius: 1,
      border: `1px solid ${theme.palette.divider}`,
      position: 'relative',
      bgcolor: 'white',
    };

    if (loadingPreviews[contractId]) {
      return (
        <Box sx={containerStyle}>
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={20} />
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (!pdfPreviews[contractId]) {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: theme.shadows[2],
              '& .hover-content': {
                bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                borderColor: theme.palette.primary.main,
              }
            }
          }}
          onClick={() => loadPdfPreview(contractId)}
        >
          <Box 
            className="hover-content"
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
              transition: 'all 0.2s ease',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <PictureAsPdfIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Click to load PDF
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (pdfPreviews[contractId] === 'error') {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
          }}
          onClick={() => loadPdfPreview(contractId)}
        >
          <Box 
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <ErrorIcon sx={{ fontSize: 24, color: theme.palette.error.main }} />
              <Typography variant="caption" color="error" textAlign="center">
                PDF error
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Click to retry
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (pdfPreviews[contractId] === 'no-pdf') {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: theme.shadows[2],
              '& .hover-content': {
                bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                borderColor: theme.palette.primary.main,
              }
            }
          }}
          onClick={() => handleContractAction({ id: contractId }, 'view')}
        >
          <Box 
            className="hover-content"
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              border: `1px dashed ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <AssignmentIcon sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                No PDF
              </Typography>
              <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                Click to view details
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    return (
      <Box 
        sx={{ 
          ...containerStyle,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme.shadows[3],
            transform: 'scale(1.01)',
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleContractAction({ id: contractId }, 'view');
        }}
      >
        <Worker workerUrl="/pdf.worker.min.js">
          <Box 
            sx={{ 
              height: '100%',
              width: '100%',
              '& .rpv-core__viewer': { 
                height: '100%',
                width: '100%',
                '& .rpv-core__doc': {
                  backgroundColor: 'white'
                },
                '& .rpv-core__page-layer': {
                  display: 'flex !important',
                  justifyContent: 'center !important',
                  alignItems: 'center !important',
                },
                '& .rpv-core__page': {
                  maxWidth: '100% !important',
                  maxHeight: '100% !important',
                  width: 'auto !important',
                  height: 'auto !important',
                  objectFit: 'contain',
                },
                // Hide everything except first page
                '& .rpv-core__page:not(:first-of-type)': {
                  display: 'none !important',
                }
              },
              // Hide scrollbars and navigation for clean thumbnail view
              '& .rpv-core__viewer-container': {
                overflow: 'hidden !important',
              },
              '& .rpv-scroll__content': {
                overflow: 'hidden !important',
              },
              '& .rpv-toolbar': {
                display: 'none !important',
              },
              '& .rpv-navigation': {
                display: 'none !important',
              }
            }}
          >
            <Viewer
              fileUrl={pdfPreviews[contractId]}
              defaultScale={0.3} // Smaller scale for thumbnail view
              initialPage={0} // Show only first page
              renderError={() => (
                <Box 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <ErrorIcon sx={{ fontSize: 20, color: 'error.main', mb: 0.5 }} />
                  <Typography variant="caption" color="error">
                    Load error
                  </Typography>
                </Box>
              )}
            />
          </Box>
        </Worker>
        
        {/* Thumbnail overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.65rem',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '.MuiBox-root:hover &': {
              opacity: 1,
            }
          }}
        >
          <VisibilityIcon sx={{ fontSize: 10, mr: 0.25 }} />
          View
        </Box>

        {/* PDF indicator badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            bgcolor: theme.palette.primary.main,
            color: 'white',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.6rem',
            fontWeight: 'bold',
          }}
        >
          PDF
        </Box>
      </Box>
    );
  };

  // Contract Details Modal Component
  const ContractDetailsModal = ({ open, contract, onClose }) => {
    if (!contract) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Contract Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contract.title || 'Untitled Contract'}
              </Typography>
            </Box>
            <Chip
              label={contract.status || 'draft'}
              color={statusColors[contract.status] || 'default'}
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
              icon={(() => {
                const IconComponent = statusIcons[contract.status] || statusIcons['draft'] || PendingIcon;
                return <IconComponent sx={{ fontSize: '16px !important' }} />;
              })()}
            />
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Contract Preview - Full PDF Viewer */}
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  width: '100%',
                  height: 600,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'white',
                }}
              >
                {pdfPreviews[contract.id] && pdfPreviews[contract.id] !== 'no-pdf' && pdfPreviews[contract.id] !== 'error' ? (
                  <Worker workerUrl="/pdf.worker.min.js">
                    <Box sx={{ height: '100%' }}>
                      <Viewer
                        fileUrl={pdfPreviews[contract.id]}
                        defaultScale={1.2} // Better scale for A4 viewing
                        renderError={() => (
                          <Box 
                            sx={{ 
                              p: 4, 
                              textAlign: 'center',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                            <Typography variant="h6" color="error">
                              Error Loading PDF
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              The PDF file could not be loaded.
                            </Typography>
                          </Box>
                        )}
                      />
                    </Box>
                  </Worker>
                ) : (
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No PDF Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      This contract contains data only.<br />
                      PDF file was not uploaded or generated.
                    </Typography>
                    {pdfPreviews[contract.id] === 'error' && (
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => loadPdfPreview(contract.id)}
                        startIcon={<PictureAsPdfIcon />}
                      >
                        Try Loading PDF
                      </Button>
                    )}
                    {pdfPreviews[contract.id] === 'no-pdf' && (
                      <Button 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/contracts/create?edit=${contract.id}`)}
                        startIcon={<PictureAsPdfIcon />}
                      >
                        Generate PDF
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Contract Information */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Basic Info */}
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Contract Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Value
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        ${contract.value || 0}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body1">
                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body1">
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1">
                        {contract.type || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Client Info */}
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Client Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Client Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {contract.clientName || contract.Client?.name || 'No Client'}
                      </Typography>
                    </Box>
                    {contract.Client?.email && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {contract.Client.email}
                        </Typography>
                      </Box>
                    )}
                    {contract.Client?.phone && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {contract.Client.phone}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>

                {/* Actions */}
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Quick Actions
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleContractAction(contract, 'download')}
                      size="small"
                    >
                      Download PDF
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={() => handleContractAction(contract, 'email')}
                      size="small"
                    >
                      Send Email
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleContractAction(contract, 'edit')}
                      size="small"
                    >
                      Edit Contract
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredContracts = contracts?.filter(contract => {
    const matchesSearch = contract.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate overview metrics with correct status matching
  const totalContracts = contracts?.length || 0;
  
  // Debug: Log actual status values to help troubleshoot
  React.useEffect(() => {
    if (contracts && contracts.length > 0) {
      console.log('Contract statuses found:', contracts.map(c => ({ id: c.id, status: c.status, title: c.title })));
      const uniqueStatuses = [...new Set(contracts.map(c => c.status))];
      console.log('Unique statuses:', uniqueStatuses);
    }
  }, [contracts]);
  
  // Active contracts - includes 'active', 'completed', 'signed' statuses
  const activeContracts = contracts?.filter(c => 
    c.status === 'active' || 
    c.status === 'ACTIVE' || 
    c.status === 'completed' || 
    c.status === 'COMPLETED' ||
    c.status === 'signed' ||
    c.status === 'SIGNED'
  )?.length || 0;
  
  // Draft contracts - includes 'draft', 'pending' statuses  
  const draftContracts = contracts?.filter(c => 
    c.status === 'draft' || 
    c.status === 'DRAFT' ||
    c.status === 'pending' ||
    c.status === 'PENDING'
  )?.length || 0;
  
  // Expired/Terminated contracts - includes 'expired', 'terminated', 'cancelled' statuses
  const expiredContracts = contracts?.filter(c => 
    c.status === 'expired' || 
    c.status === 'EXPIRED' ||
    c.status === 'terminated' ||
    c.status === 'TERMINATED' ||
    c.status === 'cancelled' ||
    c.status === 'CANCELLED'
  )?.length || 0;

  // Show loading AFTER all hooks
  if (userLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error="Please log in to access contracts." 
          title="Authentication Required"
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error={error.message || "Failed to load contracts"} 
          title="Error Loading Contracts"
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Contract Management
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    icon={user.accountType === 'business' ? <BusinessIcon /> : <PersonIcon />}
                    label={`${user.accountType?.charAt(0).toUpperCase() + user.accountType?.slice(1)} Account`}
                    color={user.accountType === 'business' ? 'primary' : 'secondary'}
                    variant="outlined"
                    size="small"
                  />
                  {user.accountType === 'business' && (
                    <Typography variant="caption" color="text.secondary">
                      Organization-wide contract management - Track all team contracts
                    </Typography>
                  )}
                  {user.accountType === 'individual' && (
                    <Typography variant="caption" color="text.secondary">
                      Personal contract management
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2}>
        <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    };
                    input.click();
                  }}
                  disabled={isUploading}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      backgroundColor: `${theme.palette.primary.main}10`,
                    }
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Contract'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/contracts/create')}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    boxShadow: `0 6px 25px ${theme.palette.primary.main}50`,
                    transform: 'translateY(-2px)',
                  }
                }}
        >
          New Contract
        </Button>
              </Stack>
      </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {user.accountType === 'business' 
                ? "Manage contracts across your organization with automated tracking and analytics"
                : "Create, manage and track your contracts with smart notifications"
              }
            </Typography>


          </Box>
        </motion.div>

        {/* Overview Cards */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)`,
                  border: `1px solid ${theme.palette.primary.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.primary.main}30`,
                      }}
                    >
                      <AssignmentIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {totalContracts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Contracts
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.main}05)`,
                  border: `1px solid ${theme.palette.success.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.success.main}30`,
                      }}
                    >
                      <CheckCircleIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {activeContracts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Contracts
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.main}05)`,
                  border: `1px solid ${theme.palette.warning.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.warning.main}30`,
                      }}
                    >
                      <EditIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {draftContracts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Draft Contracts
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.error.main}15, ${theme.palette.error.main}05)`,
                  border: `1px solid ${theme.palette.error.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
        <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.error.main}30`,
                      }}
                    >
                      <TimerIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {expiredContracts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expired/Terminated
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </motion.div>

        {/* Quick Analytics Dashboard */}
        <motion.div variants={itemVariants}>
          <MotionPaper
            variants={cardVariants}
            sx={{
              p: 3,
              mb: 4,
              background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.primary.main}08)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.info.main}20`,
              borderRadius: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Box 
                sx={{ 
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.info.main,
                  color: 'white',
                }}
              >
                <DateRangeIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  <AnalyticsIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} /> Contracts Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time contract performance and portfolio analysis • Track values, durations, and success rates
                </Typography>
              </Box>
            </Stack>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ${((contracts?.reduce((sum, c) => sum + Number(c.value || 0), 0) || 0) / 1000).toFixed(0)}k
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Portfolio Value
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {contracts?.length > 0 ? Math.round((activeContracts / contracts.length) * 100) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {contracts?.filter(c => c.autoRenew)?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Auto-Renewable
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {contracts?.length ? Math.round(contracts.reduce((sum, c) => {
                      const start = new Date(c.startDate);
                      const end = new Date(c.endDate);
                      return sum + ((end - start) / (1000 * 60 * 60 * 24));
                    }, 0) / contracts.length) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration (days)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </MotionPaper>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants}>
          <MotionPaper
            variants={cardVariants}
            sx={{
              p: 3,
              mb: 4,
              background: theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'light' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 3,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                  placeholder="Search contracts by title, client, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                  sx={getFormFieldSx()}
          />
        </Grid>
              <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  startIcon={<FilterListIcon />}
                  onClick={handleFilterClick}
                  variant="outlined"
                    sx={{
                      borderColor: 'rgba(103, 126, 234, 0.5)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(103, 126, 234, 0.1)',
                      }
                    }}
                >
                  Filter
                </Button>
                <Button
                  startIcon={<SortIcon />}
                  onClick={handleSortClick}
                  variant="outlined"
                    sx={{
                      borderColor: 'rgba(103, 126, 234, 0.5)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(103, 126, 234, 0.1)',
                      }
                    }}
                >
                  Sort
                </Button>
              </Stack>
        </Grid>
      </Grid>
          </MotionPaper>
        </motion.div>

      {/* Contracts Grid */}
        <motion.div variants={itemVariants}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AssignmentIcon sx={{ color: theme.palette.primary.main }} />
            All Contracts ({filteredContracts.length})
          </Typography>
          
          <Box
            sx={{
              maxHeight: '800px',
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'light' 
                  ? 'rgba(0, 0, 0, 0.1)' 
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '5px',
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
              },
            }}
          >
      <Grid container spacing={3}>
        <AnimatePresence>
              {filteredContracts.map((contract, index) => (
                <Grid item xs={12} lg={6} xl={4} key={contract.id}>
              <MotionCard
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    whileHover="hover"
                      transition={{ delay: (index % 6) * 0.1 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                      background: theme.palette.mode === 'light'
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${theme.palette.mode === 'light' 
                        ? 'rgba(31, 38, 135, 0.15)' 
                        : 'rgba(0, 0, 0, 0.3)'}`,
                  '&:hover': {
                        boxShadow: `0 12px 40px ${theme.palette.mode === 'light' 
                          ? 'rgba(31, 38, 135, 0.25)' 
                          : 'rgba(0, 0, 0, 0.5)'}`,
                  },
                }}
              >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <Typography variant="h6" fontWeight="bold">
                              {contract.title || 'Untitled Contract'}
                      </Typography>
                            {contract.autoRenew && (
                              <Tooltip title="Auto-Renewal Enabled">
                                <Badge 
                                  badgeContent={<AutorenewIcon sx={{ fontSize: 10 }} />}
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      bgcolor: theme.palette.success.main,
                                      color: 'white',
                                      minWidth: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                    }
                                  }}
                                >
                                  <Box />
                                </Badge>
                              </Tooltip>
                            )}
                          </Stack>
                      <Typography variant="body2" color="text.secondary">
                            {contract.clientName || contract.Client?.name || 'No Client'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                          onClick={(e) => handleActionClick(e, contract)}
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}30)`,
                            }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>

                      {/* Main Content */}
                      <Grid container spacing={2}>
                        {/* Contract Preview/Icon */}
                        <Grid item xs={12} sm={5}>
                          <PDFPreview contractId={contract.id} />
                        </Grid>
                        
                        {/* Contract Data */}
                        <Grid item xs={12} sm={7}>
                          <Stack spacing={2}>
                            {/* Contract Type */}
                    <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Type
                      </Typography>
                              <Chip
                                label={contractTypeLabels[contract.type] || 'Service Agreement'}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontWeight: 500,
                                  borderColor: theme.palette.primary.main,
                                  color: theme.palette.primary.main,
                                }}
                                icon={(() => {
                                  const IconComponent = contractTypeIcons[contract.type] || HandshakeIcon;
                                  return <IconComponent sx={{ fontSize: '14px !important' }} />;
                                })()}
                              />
                            </Box>

                            {/* Value */}
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Value
                              </Typography>
                              <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                sx={{
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  color: 'transparent'
                                }}
                              >
                                ${contract.value || 0}
        </Typography>
      </Box>

                            {/* Start Date */}
                    <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Start Date
                      </Typography>
                              <Typography variant="body2">
                                {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Box>

                            {/* Status with Dropdown */}
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Status
                              </Typography>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={contract.status || 'draft'}
                                  onChange={(e) => handleStatusChange(contract, e.target.value)}
                            sx={{ 
                                    '& .MuiSelect-select': {
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                              fontWeight: 600,
                                      textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: `${statusColors[contract.status] === 'success' ? theme.palette.success.main : 
                                                    statusColors[contract.status] === 'warning' ? theme.palette.warning.main :
                                                    statusColors[contract.status] === 'error' ? theme.palette.error.main :
                                                    statusColors[contract.status] === 'info' ? theme.palette.info.main :
                                                    theme.palette.primary.main}`,
                                    },
                                    color: statusColors[contract.status] === 'success' ? theme.palette.success.main : 
                                           statusColors[contract.status] === 'warning' ? theme.palette.warning.main :
                                           statusColors[contract.status] === 'error' ? theme.palette.error.main :
                                           statusColors[contract.status] === 'info' ? theme.palette.info.main :
                                           theme.palette.primary.main,
                                  }}
                                >
                                  <MenuItem value="draft">Draft</MenuItem>
                                  <MenuItem value="sent">Sent</MenuItem>
                                  <MenuItem value="signed">Signed</MenuItem>
                                  <MenuItem value="active">Active</MenuItem>
                                  <MenuItem value="completed">Completed</MenuItem>
                                  <MenuItem value="expired">Expired</MenuItem>
                                  <MenuItem value="terminated">Terminated</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>

                            {/* Auto-Renew Toggle */}
                            <Box>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={contract.autoRenew || false}
                                    onChange={() => handleAutoRenewToggle(contract)}
                          size="small"
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: theme.palette.success.main,
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: theme.palette.success.main,
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AutorenewIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                      Auto-Renew
                                    </Typography>
                                  </Box>
                                }
                                sx={{ margin: 0 }}
                        />
                            </Box>
                    </Stack>
                        </Grid>
                      </Grid>
                </CardContent>

                    {/* Action Buttons */}
                <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleContractAction(contract, 'download')}
                            sx={{
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.primary.main}20`,
                              }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Email">
                          <IconButton
                            size="small"
                            onClick={() => handleContractAction(contract, 'email')}
                            sx={{
                              color: theme.palette.info.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.info.main}20`,
                              }
                            }}
                      >
                            <EmailIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleContractAction(contract, 'edit')}
                            sx={{
                              color: theme.palette.warning.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.warning.main}20`,
                              }
                            }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleContractAction(contract, 'delete')}
                            sx={{
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.error.main}20`,
                              }
                            }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
        </Box>
              </MotionCard>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
          </Box>
        </motion.div>

        {/* Enhanced Analytics Section */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <Box sx={{ mt: 6 }}>
              <ContractsTotalsChart
                totals={{
                  totalValue: contracts?.reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0) || 0,
                  activeValue: contracts?.filter(c => 
                    c.status === 'active' || 
                    c.status === 'ACTIVE' || 
                    c.status === 'completed' || 
                    c.status === 'COMPLETED' ||
                    c.status === 'signed' ||
                    c.status === 'SIGNED'
                  ).reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0) || 0,
                  totalCount: contracts?.length || 0,
                  activeCount: activeContracts,
                  draftCount: draftContracts,
                  expiredCount: expiredContracts,
                }}
                formatCurrency={(amount) => 
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(amount)
                }
                contracts={contracts || []} // Pass the contracts data for analytics
              />
            </Box>
          </motion.div>
        )}
      </motion.div>

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={() => handleContractAction(selectedContract, 'view')}>
          <VisibilityIcon sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleContractAction(selectedContract, 'edit')}>
          <EditIcon sx={{ mr: 2 }} />
          Edit Contract
        </MenuItem>
        <MenuItem onClick={() => handleContractAction(selectedContract, 'download')}>
          <DownloadIcon sx={{ mr: 2 }} />
          Download PDF
        </MenuItem>
        <MenuItem onClick={() => handleContractAction(selectedContract, 'email')}>
          <EmailIcon sx={{ mr: 2 }} />
          Send Email
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleContractAction(selectedContract, 'delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 2 }} />
          Delete Contract
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
            minWidth: 200,
          }
        }}
      >
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleFilterClose();
              }}
              label="Status"
              size="small"
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="signed">Signed</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                handleFilterClose();
              }}
              label="Date Range"
              size="small"
            >
              <MenuItem value="ALL">All Time</MenuItem>
              <MenuItem value="THIS_MONTH">This Month</MenuItem>
              <MenuItem value="LAST_MONTH">Last Month</MenuItem>
              <MenuItem value="THIS_QUARTER">This Quarter</MenuItem>
              <MenuItem value="THIS_YEAR">This Year</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchor}
        open={Boolean(sortAnchor)}
        onClose={handleSortClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={() => { setSortBy('DATE_DESC'); handleSortClose(); }}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('DATE_ASC'); handleSortClose(); }}>
          Oldest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('EXPIRY_DESC'); handleSortClose(); }}>
          Expiring Soon
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('EXPIRY_ASC'); handleSortClose(); }}>
          Expiring Last
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('STATUS'); handleSortClose(); }}>
          By Status
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>Delete Contract</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete contract "{selectedContract?.title}"?
          This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteContractMutation.isLoading}
          >
            {deleteContractMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Missing Information Modal */}
      <MissingInfoModal
        open={modalOpen}
        missingFields={missingFields}
        onSubmit={handleMissingInfoSubmit}
        onClose={() => {
          setModalOpen(false);
          setMissingFields('');
          setUploadedFileKey(null);
        }}
        existingClients={existingClients}
      />

      {/* Upload Contract Modal */}
      <UploadContractModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          // Refresh the contracts list
          refetchContracts();
        }}
      />

      {/* Contract Details Modal */}
      <ContractDetailsModal
        open={viewDetailsOpen}
        contract={selectedContract}
        onClose={() => {
          setViewDetailsOpen(false);
          setSelectedContract(null);
        }}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
          setSelectedContract(null);
        }}
        onSend={handleSendEmail}
        title="Send Contract Email"
        defaultEmail={selectedContract?.client?.email || selectedContract?.Client?.email}
        itemType="contract"
        itemData={selectedContract}
      />

      {/* Edit Contract Modal */}
      <EditContractModal
        open={editModalOpen}
        contract={selectedContract}
        existingClients={existingClients}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedContract(null);
        }}
      />
    </Container>
  );
}