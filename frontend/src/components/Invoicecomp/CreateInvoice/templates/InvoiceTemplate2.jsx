import React from 'react';
import { Box, Typography, Grid, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { motion } from 'framer-motion';

const formatNumberWithCommas = (num) => {
  if (!num) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (val) => {
  if (!val) return '';
  const date = new Date(val);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const calculateItemTotal = (unitPrice, quantity) => {
  return Number(unitPrice || 0) * Number(quantity || 0);
};

const calculateSubTotal = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + calculateItemTotal(item.unitPrice || item.price, item.quantity), 0);
};

const calculateTotal = (items, charges) => {
  const subTotal = calculateSubTotal(items);
  let total = subTotal;
  
  // Handle charges object structure
  const chargesObj = charges || {};
  
  // Tax calculation (percentage of subtotal)
  if (chargesObj.tax && Number(chargesObj.tax) > 0) {
    total += subTotal * (Number(chargesObj.tax) / 100);
  }
  
  // Discount calculation (fixed amount, not percentage)
  if (chargesObj.discount && Number(chargesObj.discount) > 0) {
    total -= Number(chargesObj.discount);
  }
  
  // Shipping calculation (fixed amount)
  if (chargesObj.shipping && Number(chargesObj.shipping) > 0) {
    total += Number(chargesObj.shipping);
  }
  
  return Math.max(0, total); // Ensure total is never negative
};

const InvoiceTemplate2 = ({ 
  sender = {}, 
  receiver = {}, 
  details = {}, 
  charges = {},
  paymentInformation = {},
  logo, 
  forPdf = false 
}) => {
  const paymentInfo = paymentInformation || details?.paymentInformation || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const noHyphenStyle = {
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'none',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  };

  // Clean professional color scheme
  const colors = {
    primary: '#2c3e50',        // Dark blue-gray
    secondary: '#34495e',      // Medium blue-gray  
    accent: '#3498db',         // Clean blue
    light: '#ecf0f1',         // Very light gray
    lightBlue: '#f8fbff',     // Very light blue
    border: '#d5dbdb',        // Light border
    text: '#2c3e50',          // Dark text
    textSecondary: '#5d6d7e', // Secondary text
    success: '#27ae60',       // Green for positive amounts
    danger: '#e74c3c'         // Red for negative amounts
  };

  // Get items from details - handle different data sources
  const items = details.items || [];
  const subTotal = calculateSubTotal(items);
  
  // Handle charges from different sources (charges prop or details.charges)
  const effectiveCharges = charges || details.charges || {};
  const totalAmount = calculateTotal(items, effectiveCharges);

  return (
    <>
      {forPdf && (
        <style>
          {`
            /* PDF-specific styles for better page breaks and spacing */
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
            .page-break-after {
              page-break-after: always !important;
              break-after: page !important;
            }
            .signature-area, .payment-information, .notes-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              min-height: 120px;
            }
            /* Prevent orphaned lines */
            table, .totals-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* Optimize spacing for PDF */
            .MuiBox-root {
              margin-bottom: 8px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            .MuiTypography-root {
              margin-bottom: 4px !important;
            }
            .MuiGrid-container {
              margin-bottom: 8px !important;
            }
            /* Reduce excessive spacing between sections */
            .MuiGrid-item + .MuiGrid-item {
              margin-top: 0 !important;
            }
            @media print {
              .no-print { display: none !important; }
            }
          `}
        </style>
      )}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ 
          minHeight: forPdf ? 'auto' : '100vh',
          width: forPdf ? '100%' : '100%',
          backgroundColor: forPdf ? '#ffffff' : colors.lightBlue,
          padding: forPdf ? '1mm 2mm' : '40px',
          margin: '0 auto',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          fontSize: forPdf ? '14px' : '16px',
          lineHeight: forPdf ? '1.4' : '1.6',
          boxSizing: 'border-box'
        }}
      >
        <Paper
          elevation={forPdf ? 0 : 2}
          sx={{ 
            maxWidth: forPdf ? 'none' : '900px',
            width: forPdf ? '100%' : 'auto',
            margin: '0 auto', 
            backgroundColor: '#ffffff',
            borderRadius: forPdf ? 0 : 2,
            overflow: 'hidden',
            minHeight: forPdf ? 'auto' : 'initial',
            border: forPdf ? 'none' : `1px solid ${colors.border}`,
            // Ensure content stays within bounds for PDF
            '& *': {
              maxWidth: '100% !important',
              boxSizing: 'border-box !important'
            },
            // Fix table layout for PDF
            '& table': {
              tableLayout: forPdf ? 'auto' : 'auto',
              width: '100% !important',
              borderCollapse: 'collapse !important'
            },
            '& th, & td': {
              verticalAlign: 'top !important',
              padding: forPdf ? '8px 6px !important' : '12px 16px !important',
              lineHeight: forPdf ? '1.4 !important' : '1.5 !important',
              fontSize: forPdf ? '13px !important' : 'inherit !important',
              wordWrap: 'break-word !important',
              whiteSpace: 'normal !important'
            }
          }}
        >
          
          {/* Professional Header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              bgcolor: colors.primary,
              p: forPdf ? 2 : 4,
              color: 'white'
            }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  {logo && (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={logo}
                        alt="Company Logo"
                        style={{
                          maxHeight: 80,
                          maxWidth: '100%',
                          objectFit: 'contain',
                          filter: 'brightness(0) invert(1)'
                        }}
                      />
                    </Box>
                  )}
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      mb: 1,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      letterSpacing: '0.05em',
                      ...noHyphenStyle,
                    }}
                  >
                    INVOICE
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 500,
                      ...noHyphenStyle,
                    }}
                  >
                    {details.invoiceNumber ? `#${details.invoiceNumber}` : '#000001'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    p: 3, 
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}>
                    {details.issueDate && (
                      <Typography variant="body1" sx={{ mb: 1, color: 'white', fontWeight: 500, ...noHyphenStyle }}>
                        <strong>Issue Date:</strong> {formatDate(details.issueDate)}
                      </Typography>
                    )}
                    {details.dueDate && (
                      <Typography variant="body1" sx={{ mb: 1, color: 'white', fontWeight: 500, ...noHyphenStyle }}>
                        <strong>Due Date:</strong> {formatDate(details.dueDate)}
                      </Typography>
                    )}
                    {details.status && (
                      <Box sx={{ 
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: details.status === 'Paid' ? colors.success : '#f39c12',
                        color: 'white',
                        fontWeight: 'bold',
                        mt: 1
                      }}>
                        <Typography variant="body2" sx={{ ...noHyphenStyle }}>
                          {details.status}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Clean Bill From & Bill To Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ p: forPdf ? 2 : 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3,
                    bgcolor: colors.light,
                    borderRadius: 2,
                    borderLeft: `4px solid ${colors.accent}`,
                    height: '100%'
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: colors.primary,
                        mb: 2,
                        ...noHyphenStyle,
                      }}
                    >
                      Bill From
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: colors.text, ...noHyphenStyle }}>
                      {sender.name || 'Your Company Name'}
                    </Typography>
                    {sender.address && (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                        {sender.address}
                      </Typography>
                    )}
                    {sender.city && (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                        {sender.city}
                      </Typography>
                    )}
                    {sender.email && (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, ...noHyphenStyle }}>
                        {sender.email}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3,
                    bgcolor: colors.light,
                    borderRadius: 2,
                    borderLeft: `4px solid ${colors.secondary}`,
                    height: '100%'
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: colors.primary,
                        mb: 2,
                        ...noHyphenStyle,
                      }}
                    >
                      Bill To
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: colors.text, ...noHyphenStyle }}>
                      {receiver.name || 'Client Name'}
                    </Typography>
                    {receiver.address && (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                        {receiver.address}
                      </Typography>
                    )}
                    {receiver.city && (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                        {receiver.city}
                      </Typography>
                    )}
                    {receiver.email && (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, ...noHyphenStyle }}>
                        {receiver.email}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Professional Items Table */}
          <motion.div variants={itemVariants}>
            <Box sx={{ px: forPdf ? 2 : 4, pb: forPdf ? 2 : 4 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: colors.primary,
                  mb: 3,
                  ...noHyphenStyle,
                }}
              >
                Items & Services
              </Typography>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  border: `1px solid ${colors.border}`, 
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: colors.primary }}>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        py: 2,
                        ...noHyphenStyle 
                      }}>
                        Description
                      </TableCell>
                      <TableCell align="center" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        py: 2,
                        ...noHyphenStyle 
                      }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        py: 2,
                        ...noHyphenStyle 
                      }}>
                        Unit Price
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        py: 2,
                        ...noHyphenStyle 
                      }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: '#ffffff' },
                          '&:nth-of-type(even)': { bgcolor: colors.lightBlue },
                          '&:hover': { 
                            bgcolor: colors.light,
                            transition: 'background-color 0.2s ease'
                          }
                        }}
                      >
                        <TableCell sx={{ py: 2, ...noHyphenStyle }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: colors.text, ...noHyphenStyle }}>
                            {item.name || item.description || 'Item'}
                          </Typography>
                          {item.description && item.name && (
                            <Typography variant="body2" sx={{ color: colors.textSecondary, ...noHyphenStyle }}>
                              {item.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2, ...noHyphenStyle }}>
                          <Box sx={{ 
                            display: 'inline-block',
                            minWidth: '40px',
                            textAlign: 'center',
                            py: 0.5,
                            px: 1.5,
                            bgcolor: colors.accent,
                            color: 'white',
                            borderRadius: 1,
                            fontWeight: 'bold'
                          }}>
                            {item.quantity || 1}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, ...noHyphenStyle }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 600, 
                            color: colors.text,
                            fontFamily: 'monospace',
                            ...noHyphenStyle 
                          }}>
                            ${formatNumberWithCommas(item.unitPrice || item.price || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, ...noHyphenStyle }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 700, 
                            color: colors.success, 
                            fontSize: '1.1rem',
                            fontFamily: 'monospace',
                            ...noHyphenStyle 
                          }}>
                            ${formatNumberWithCommas(calculateItemTotal(item.unitPrice || item.price, item.quantity))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </motion.div>

          {/* Clean Totals Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ px: forPdf ? 2 : 4, pb: forPdf ? 2 : 4 }}>
              <Grid container justifyContent="flex-end">
                <Grid item xs={12} md={5}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: colors.light,
                    border: `1px solid ${colors.border}`
                  }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: colors.text, ...noHyphenStyle }}>
                          Subtotal:
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600, 
                          color: colors.text,
                          fontFamily: 'monospace',
                          ...noHyphenStyle 
                        }}>
                          ${formatNumberWithCommas(subTotal)}
                        </Typography>
                      </Box>
                      
                      {effectiveCharges.tax && Number(effectiveCharges.tax) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colors.textSecondary, ...noHyphenStyle }}>
                            Tax ({effectiveCharges.tax}%):
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: colors.textSecondary,
                            fontFamily: 'monospace',
                            ...noHyphenStyle 
                          }}>
                            ${formatNumberWithCommas(subTotal * (Number(effectiveCharges.tax) / 100))}
                          </Typography>
                        </Box>
                      )}
                      
                      {effectiveCharges.discount && Number(effectiveCharges.discount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colors.danger, ...noHyphenStyle }}>
                            Discount:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: colors.danger,
                            fontFamily: 'monospace',
                            ...noHyphenStyle 
                          }}>
                            -${formatNumberWithCommas(effectiveCharges.discount)}
                          </Typography>
                        </Box>
                      )}
                      
                      {effectiveCharges.shipping && Number(effectiveCharges.shipping) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colors.textSecondary, ...noHyphenStyle }}>
                            Shipping:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: colors.textSecondary,
                            fontFamily: 'monospace',
                            ...noHyphenStyle 
                          }}>
                            ${formatNumberWithCommas(effectiveCharges.shipping)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ borderColor: colors.border, borderWidth: 1 }} />
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: colors.primary
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', ...noHyphenStyle }}>
                          Total Amount:
                        </Typography>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700, 
                          color: 'white',
                          fontFamily: 'monospace',
                          ...noHyphenStyle 
                        }}>
                          ${formatNumberWithCommas(totalAmount)}
                        </Typography>
                      </Box>
                      
                      {details.currency && details.currency !== 'USD' && (
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                          <Typography variant="caption" sx={{ 
                            color: colors.textSecondary,
                            fontStyle: 'italic',
                            ...noHyphenStyle 
                          }}>
                            All amounts in {details.currency}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Professional Payment Information Section */}
          {paymentInfo && (Object.values(paymentInfo).some(val => val && val.toString().trim() !== '') || 
           (paymentInfo.bankName || paymentInfo.accountName || paymentInfo.accountNumber || 
            paymentInfo.swiftCode || paymentInfo.routingNumber || paymentInfo.paypalEmail || 
            paymentInfo.merchantId || paymentInfo.additionalInstructions)) && (
            <motion.div variants={itemVariants}>
              <Box 
                className="payment-information page-break-avoid"
                sx={{ 
                  px: forPdf ? 2 : 4,
                  pb: forPdf ? 2 : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.primary,
                    mb: 3,
                    ...noHyphenStyle,
                  }}
                >
                  Payment Information
                </Typography>

                <Paper sx={{ 
                  p: forPdf ? 2 : 3, 
                  borderRadius: 2,
                  bgcolor: colors.light,
                  border: `1px solid ${colors.border}`
                }}>
                  <Grid container spacing={4}>
                    {/* Accepted Payment Methods */}
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary, ...noHyphenStyle }}>
                          Accepted Payment Methods
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {['Bank Transfer', 'Credit Cards', 'PayPal', 'Check'].map((method) => (
                            <Box
                              key={method}
                              sx={{ 
                                px: 2,
                                py: 0.5,
                                bgcolor: colors.accent,
                                color: 'white',
                                borderRadius: 1,
                                fontWeight: 600,
                                fontSize: '0.875rem'
                              }}
                            >
                              {method}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Grid>
                    
                    {/* Bank Details */}
                    {(paymentInfo.bankName || paymentInfo.accountName || paymentInfo.accountNumber || paymentInfo.swiftCode || paymentInfo.routingNumber) && (
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'white', border: `1px solid ${colors.border}` }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary, ...noHyphenStyle }}>
                            Bank Details
                          </Typography>

                          {paymentInfo.bankName && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                Bank Name
                              </Typography>
                              <Typography variant="body1" sx={{ color: colors.text, ...noHyphenStyle }}>
                                {paymentInfo.bankName}
                              </Typography>
                            </Box>
                          )}

                          {paymentInfo.accountName && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                Account Name
                              </Typography>
                              <Typography variant="body1" sx={{ color: colors.text, ...noHyphenStyle }}>
                                {paymentInfo.accountName}
                              </Typography>
                            </Box>
                          )}

                          {paymentInfo.accountNumber && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                Account Number
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                fontFamily: 'monospace', 
                                bgcolor: colors.lightBlue, 
                                p: 1, 
                                borderRadius: 1, 
                                color: colors.text, 
                                border: `1px solid ${colors.border}`,
                                ...noHyphenStyle 
                              }}>
                                {paymentInfo.accountNumber}
                              </Typography>
                            </Box>
                          )}
                          
                          {paymentInfo.swiftCode && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                SWIFT/BIC Code
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                fontFamily: 'monospace', 
                                bgcolor: colors.lightBlue, 
                                p: 1, 
                                borderRadius: 1, 
                                color: colors.text, 
                                border: `1px solid ${colors.border}`,
                                ...noHyphenStyle 
                              }}>
                                {paymentInfo.swiftCode}
                              </Typography>
                            </Box>
                          )}
                          
                          {paymentInfo.routingNumber && (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                Routing Number
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                fontFamily: 'monospace', 
                                bgcolor: colors.lightBlue, 
                                p: 1, 
                                borderRadius: 1, 
                                color: colors.text, 
                                border: `1px solid ${colors.border}`,
                                ...noHyphenStyle 
                              }}>
                                {paymentInfo.routingNumber}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    )}

                    {/* Online Payment */}
                    {(paymentInfo.paypalEmail || paymentInfo.merchantId || paymentInfo.additionalInstructions) && (
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'white', border: `1px solid ${colors.border}` }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary, ...noHyphenStyle }}>
                            Online Payment Options
                          </Typography>
                          
                          {paymentInfo.paypalEmail && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                PayPal
                              </Typography>
                              <Typography variant="body1" sx={{ color: colors.text, ...noHyphenStyle }}>
                                {paymentInfo.paypalEmail}
                              </Typography>
                            </Box>
                          )}
                          
                          {paymentInfo.merchantId && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary, mb: 0.5, ...noHyphenStyle }}>
                                Merchant ID
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                fontFamily: 'monospace', 
                                bgcolor: colors.lightBlue, 
                                p: 1, 
                                borderRadius: 1, 
                                color: colors.text, 
                                border: `1px solid ${colors.border}`,
                                ...noHyphenStyle 
                              }}>
                                {paymentInfo.merchantId}
                              </Typography>
                            </Box>
                          )}
                          
                          {paymentInfo.additionalInstructions && (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: colors.textSecondary, ...noHyphenStyle }}>
                                Payment Instructions
                              </Typography>
                              <Paper sx={{ 
                                p: 2,
                                bgcolor: '#fff9e6',
                                border: `1px solid #f1c40f`,
                                borderRadius: 1
                              }}>
                                <Typography variant="body2" sx={{ 
                                  lineHeight: 1.6,
                                  color: '#8e44ad',
                                  ...noHyphenStyle 
                                }}>
                                  {paymentInfo.additionalInstructions}
                                </Typography>
                              </Paper>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Box>
            </motion.div>
          )}

          {/* Professional Signature Section */}
          {details.signature && (
            <motion.div variants={itemVariants}>
              <Box 
                className="signature-area page-break-avoid"
                sx={{
                  px: forPdf ? 2 : 4,
                  pb: forPdf ? 2 : 4,
                  marginTop: forPdf ? '10px' : 3
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.primary,
                    mb: 3,
                    ...noHyphenStyle,
                  }}
                >
                  Authorized Signature
                </Typography>
                  
                <Paper sx={{ 
                  p: forPdf ? 2 : 3,
                  borderRadius: 2,
                  border: `1px solid ${colors.border}`,
                  bgcolor: colors.light,
                  minHeight: forPdf ? 100 : 140,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', mb: 2 }}>
                    {/* Handle different signature types */}
                    {(() => {
                      // Handle object signature (drawn, uploaded, or typed)
                      if (typeof details.signature === 'object' && details.signature?.data) {
                        // Check if it's an image (drawn or uploaded)
                        if (typeof details.signature.data === 'string' && details.signature.data.startsWith('data:image')) {
                          return (
                            <img
                              src={details.signature.data}
                              alt="Signature"
                              style={{
                                maxHeight: 80,
                                maxWidth: 300,
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        // Handle typed signature with font
                        else if (details.signature.fontFamily) {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                fontFamily: details.signature.fontFamily || 'cursive',
                                color: colors.primary,
                                fontStyle: 'italic',
                                ...noHyphenStyle,
                              }}
                            >
                              {details.signature.data}
                            </Typography>
                          );
                        }
                        // Handle plain text in signature object
                        else {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                fontFamily: 'cursive',
                                color: colors.primary,
                                fontStyle: 'italic',
                                ...noHyphenStyle,
                              }}
                            >
                              {details.signature.data}
                            </Typography>
                          );
                        }
                      }
                      // Handle string signature
                      else if (typeof details.signature === 'string') {
                        // Check if it's an image data URL
                        if (details.signature.startsWith('data:image')) {
                          return (
                            <img
                              src={details.signature}
                              alt="Signature"
                              style={{
                                maxHeight: 80,
                                maxWidth: 300,
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        // Handle plain text signature
                        else {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                fontFamily: 'cursive',
                                color: colors.primary,
                                fontStyle: 'italic',
                                ...noHyphenStyle,
                              }}
                            >
                              {details.signature}
                            </Typography>
                          );
                        }
                      }
                      // No signature
                      return null;
                    })()}
                  </Box>
                    
                  {/* Signature line and date */}
                  <Box sx={{ borderTop: `2px solid ${colors.primary}`, pt: 2, mt: 'auto' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, ...noHyphenStyle }}>
                          Authorized Signature
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, ...noHyphenStyle }}>
                          Date: {formatDate(new Date())}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Box>
            </motion.div>
          )}

          {/* Professional Additional Notes */}
          {(details.additionalNotes || details.notes) && (
            <motion.div variants={itemVariants}>
              <Box 
                className="notes-section page-break-avoid"
                sx={{
                  px: forPdf ? 2 : 4,
                  pb: forPdf ? 2 : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary, mb: 2, ...noHyphenStyle }}>
                  Additional Notes
                </Typography>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  bgcolor: colors.lightBlue, 
                  border: `1px solid ${colors.border}`
                }}>
                  <Typography variant="body1" sx={{ color: colors.text, lineHeight: 1.6, ...noHyphenStyle }}>
                    {details.additionalNotes || details.notes}
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          )}

          {/* Clean Professional Footer */}
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              bgcolor: colors.primary,
              p: forPdf ? 2 : 3,
              textAlign: 'center',
              marginTop: forPdf ? '8px' : '16px'
            }}>
              <Typography variant="h6" sx={{ 
                color: 'white',
                fontWeight: 600,
                ...noHyphenStyle 
              }}>
                Thank you for your business!
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                mt: 1,
                ...noHyphenStyle 
              }}>
                We appreciate your trust and look forward to working with you again.
              </Typography>
            </Box>
          </motion.div>
        </Paper>
      </motion.div>
    </>
  );
};

export default InvoiceTemplate2;
