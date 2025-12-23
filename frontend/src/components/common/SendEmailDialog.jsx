import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Stack,
  Chip,
  IconButton,
  useTheme,
  CircularProgress,
  InputAdornment,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const SendEmailDialog = ({ 
  open, 
  onClose, 
  onSend, 
  title, 
  defaultEmail, 
  itemType = 'document', // 'invoice' or 'contract'
  itemData = {},
  isLoading = false 
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [error, setError] = useState('');

  // Update email when defaultEmail changes or dialog opens
  React.useEffect(() => {
    if (open && defaultEmail) {
      setEmail(defaultEmail);
    } else if (open && !defaultEmail && itemData) {
      // Try to extract email from itemData if defaultEmail is not provided
      const extractedEmail = itemData?.client?.email || 
                             itemData?.Client?.email || 
                             itemData?.clientEmail ||
                             itemData?.recipient?.email || '';
      setEmail(extractedEmail);
    }
  }, [open, defaultEmail, itemData]);

  const handleSend = async () => {
    console.log('=== SendEmailDialog handleSend START ===');
    console.log('Email:', email);
    console.log('Message:', message);
    console.log('Sender Name:', senderName);
    console.log('onSend function:', onSend);
    
    setError('');
    
    if (!email) {
      console.log('ERROR: Email is required');
      setError('Email address is required');
      return;
    }

    if (!email.includes('@')) {
      console.log('ERROR: Invalid email format');
      setError('Please enter a valid email address');
      return;
    }

    try {
      console.log('Calling onSend with data:', {
        email: email.trim(),
        message: message.trim(),
        senderName: senderName.trim()
      });
      
      await onSend({
        email: email.trim(),
        message: message.trim(),
        senderName: senderName.trim()
      });
      
      console.log('onSend completed successfully');
      
      // Reset form after successful send
      setEmail('');
      setMessage('');
      setSenderName('');
      onClose();
      console.log('=== SendEmailDialog handleSend SUCCESS ===');
    } catch (err) {
      console.error('=== SendEmailDialog handleSend ERROR ===');
      console.error('Error:', err);
      setError(err.message || 'Failed to send email');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const getItemTypeDetails = () => {
    switch (itemType) {
      case 'invoice':
        return {
          icon: DescriptionIcon,
          color: theme.palette.primary.main,
          label: 'Invoice',
          defaultSubject: `Invoice ${itemData?.invoiceNumber || itemData?.number || ''}`
        };
      case 'contract':
        return {
          icon: ArticleIcon,
          color: theme.palette.secondary.main,
          label: 'Contract',
          defaultSubject: `Contract: ${itemData?.title || 'Service Agreement'}`
        };
      default:
        return {
          icon: AttachFileIcon,
          color: theme.palette.info.main,
          label: 'Document',
          defaultSubject: 'Document'
        };
    }
  };

  const typeDetails = getItemTypeDetails();

  if (!open) {
    return null;
  }

  // Don't render if we're expecting itemData but it's null
  if (open && (itemType === 'invoice' || itemType === 'contract') && !itemData) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={false}
      disableEnforceFocus={false}
      disableAutoFocus={false}
      keepMounted={false}
      style={{
        zIndex: 9999999
      }}
      PaperProps={{
        sx: {
          background: theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: 3,
          zIndex: 9999999
        }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${typeDetails.color}15, ${typeDetails.color}05)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${typeDetails.color}, ${typeDetails.color}dd)`,
                color: 'white',
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 20px ${typeDetails.color}30`
              }}
            >
              <typeDetails.icon sx={{ color: typeDetails.color, fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Send {typeDetails.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title || typeDetails.defaultSubject}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Item Details Chip */}
          {(itemData?.invoiceNumber || itemData?.title) && (
            <Box>
              <Chip
                icon={<EmailIcon />}
                label={`${typeDetails.label}: ${itemData?.invoiceNumber || itemData?.title || 'Untitled'}`}
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              {(itemData?.totalAmount || itemData?.value) && (
                <Chip
                  label={`Amount: $${parseFloat(itemData?.totalAmount || itemData?.value || 0).toFixed(2)}`}
                  color="secondary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Warning about missing client email */}
          {!defaultEmail && !email && (itemType === 'invoice' || itemType === 'contract') && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No client email found for this {itemType}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                To avoid entering emails manually, edit this {itemType} to add client information with an email address.
              </Typography>
            </Alert>
          )}

          {/* Email Fields */}
          <TextField
            label="Recipient Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            placeholder="client@example.com"
            error={!!error && !email}
            helperText={
              !email && !defaultEmail 
                ? 'No client email found. Please enter the recipient\'s email address.'
                : (!email && error ? 'Email is required' : 'Enter the client\'s email address')
            }
            InputProps={{
              startAdornment: !email && !defaultEmail && (
                <InputAdornment position="start">
                  <Tooltip title="This invoice doesn't have a client email address associated with it">
                    <WarningIcon color="warning" fontSize="small" />
                  </Tooltip>
                </InputAdornment>
              )
            }}
                        sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(20px)',
              }
            }}
          />

          <TextField
            label="Your Name (Optional)"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            fullWidth
            placeholder="Your name or company name"
            helperText="This will appear as the sender name in the email"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(20px)',
              }
            }}
          />

          <TextField
            label="Custom Message (Optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Add a personal message to include with the email..."
            helperText="This message will be included in the email along with the document link"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(20px)',
              }
            }}
          />

          {/* Information Box */}
          <Box
            sx={{
              background: theme.palette.mode === 'light'
                ? 'rgba(103, 126, 234, 0.05)'
                : 'rgba(103, 126, 234, 0.1)',
              border: `1px solid ${theme.palette.primary.main}20`,
              borderRadius: 2,
              p: 2,
              borderLeft: `4px solid ${theme.palette.primary.main}`
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>What happens next:</strong>
              <br />
              • A professional email will be sent to the recipient
              <br />
              • They'll receive a secure link to view the {itemType}
              <br />
              • The link will remain valid for 30 days
              <br />
              • No account registration required for viewing
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={isLoading || !email}
          sx={{
            background: `linear-gradient(135deg, ${typeDetails.color}, ${typeDetails.color}dd)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${typeDetails.color}dd, ${typeDetails.color}bb)`,
            }
          }}
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendEmailDialog; 