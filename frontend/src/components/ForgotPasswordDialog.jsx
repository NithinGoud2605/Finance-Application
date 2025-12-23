import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Button, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle, TextField 
} from '@mui/material';
import { forgotPassword, confirmForgotPassword } from '../services/api';

function ForgotPasswordDialog({ open, handleClose }) {
  const [step, setStep] = useState(1); // 1: Request code, 2: Confirm reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      // Handle the new error format from backend
      let errorMessage = 'Failed to send reset code. Please try again.';
      
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.error?.code === 'MISSING_EMAIL') {
        errorMessage = 'Please enter your email address.';
      } else if (err.response?.data?.error?.code === 'FORGOT_PASSWORD_FAILED') {
        errorMessage = 'Unable to process password reset request. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await confirmForgotPassword({ email, code, newPassword });
      setMessage(data.message || 'Password has been reset successfully!');
      // Close the dialog after a successful reset
      setTimeout(() => {
        handleClose();
        setStep(1); // Reset to step 1 for next use
        setEmail('');
        setCode('');
        setNewPassword('');
        setError('');
        setMessage('');
      }, 2000);
    } catch (err) {
      console.error('Password reset confirmation error:', err);
      // Handle the new error format from backend
      let errorMessage = 'Password reset failed. Please try again.';
      
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.error?.code === 'INVALID_CODE') {
        errorMessage = 'Invalid confirmation code. Please check the code sent to your email.';
      } else if (err.response?.data?.error?.code === 'EXPIRED_CODE') {
        errorMessage = 'The confirmation code has expired. Please request a new one.';
      } else if (err.response?.data?.error?.code === 'USER_NOT_FOUND') {
        errorMessage = 'User account not found. Please check your email address.';
      } else if (err.response?.data?.error?.code === 'MISSING_FIELDS') {
        errorMessage = 'Please fill in all required fields.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      {step === 1 ? (
        <form onSubmit={handleRequestSubmit}>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter your email address to receive a password reset code.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <DialogContentText color="error">{error}</DialogContentText>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Send Code</Button>
          </DialogActions>
        </form>
      ) : (
        <form onSubmit={handleConfirmSubmit}>
          <DialogTitle>Confirm Password Reset</DialogTitle>
          <DialogContent>
            <DialogContentText>
              A reset code has been sent to {email}. Please enter the code along with your new password.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Reset Code"
              type="text"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            {error && <DialogContentText color="error">{error}</DialogContentText>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Reset Password</Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}

ForgotPasswordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default ForgotPasswordDialog;
