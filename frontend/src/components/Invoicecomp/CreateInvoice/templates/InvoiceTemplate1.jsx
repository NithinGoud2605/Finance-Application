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
  return items.reduce((sum, item) => sum + calculateItemTotal(item.unitPrice, item.quantity), 0);
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

const InvoiceTemplate1 = ({
  sender = {},
  receiver = {},
  details = {},
  charges = {},
  paymentInformation = {},
  logo,
  forPdf = false 
}) => {
  const paymentInfo = paymentInformation || {};
  
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const noHyphenStyle = {
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'none',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  };

  // Get items from details - handle different data sources
  const items = details.items || [];
  const subTotal = calculateSubTotal(items);
  
  // Handle charges from different sources (charges prop or details.charges)
  const effectiveCharges = charges || details.charges || {};
  const totalAmount = calculateTotal(items, effectiveCharges);

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Template1 Debug:', {
      items,
      charges,
      details: details.charges,
      effectiveCharges,
      subTotal,
      totalAmount
    });
  }

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
          backgroundColor: forPdf ? '#ffffff' : '#f8f9fa',
          padding: forPdf ? '1mm 2mm' : '50px', // Minimal uniform padding to match preview
          margin: '0 auto',
          fontFamily: '"Arial", "Helvetica", sans-serif',
          fontSize: forPdf ? '14px' : '16px',
          lineHeight: forPdf ? '1.4' : '1.6',
          boxSizing: 'border-box'
        }}
      >
      <Box sx={{ 
        maxWidth: forPdf ? 'none' : '800px',
        width: forPdf ? '100%' : 'auto',
        margin: '0 auto', 
        backgroundColor: '#ffffff',
        borderRadius: forPdf ? 0 : 1,
        boxShadow: forPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minHeight: forPdf ? 'auto' : 'initial',
        padding: forPdf ? 0 : 'initial',
        // Ensure content stays within bounds for PDF
        '& *': {
          maxWidth: '100% !important',
          boxSizing: 'border-box !important'
        },
        // Fix table layout for PDF
        '& table': {
          tableLayout: forPdf ? 'auto' : 'auto', // Use auto layout for better text rendering
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
      }}>
        
        {/* Professional Header */}
        <motion.div variants={itemVariants}>
          <Box 
            className="page-break-avoid"
        sx={{
              p: forPdf ? '8px 0' : 4, 
              borderBottom: '2px solid #2c3e50',
              marginBottom: forPdf ? '8px' : 3
            }}
          >
            <Grid container spacing={forPdf ? 2 : 4} alignItems="flex-start">
              <Grid item xs={12} md={6}>
                                  {logo && (
                    <Box sx={{ mb: forPdf ? 1 : 3 }}>
        <img
                        src={logo}
                        alt="Company Logo"
            style={{ 
                          maxHeight: forPdf ? 60 : 80,
                          maxWidth: forPdf ? 180 : 200,
                          objectFit: 'contain'
            }}
        />
                    </Box>
                  )}
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                    color: '#2c3e50',
                    mb: 1,
                    letterSpacing: '1px',
                    ...noHyphenStyle,
              }}
            >
                  INVOICE
            </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#7f8c8d',
                  fontWeight: 500,
                  ...noHyphenStyle 
                }}>
                  #{details.invoiceNumber || '000001'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 2, 
                    color: '#2c3e50',
                    ...noHyphenStyle 
                  }}>
                    {sender.name || 'Your Company Name'}
                  </Typography>
                  {sender.address && (
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#7f8c8d', ...noHyphenStyle }}>
                      {sender.address}
              </Typography>
            )}
                  {(sender.city || sender.state || sender.zipCode) && (
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#7f8c8d', ...noHyphenStyle }}>
                      {[sender.city, sender.state, sender.zipCode].filter(Boolean).join(', ')}
                    </Typography>
                  )}
                  {sender.country && (
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#7f8c8d', ...noHyphenStyle }}>
                      {sender.country}
                    </Typography>
                  )}
                  {sender.email && (
                    <Typography variant="body2" sx={{ color: '#7f8c8d', ...noHyphenStyle }}>
                      {sender.email}
              </Typography>
            )}
          </Box>
              </Grid>
            </Grid>
        </Box>
        </motion.div>

        {/* Main Content */}
        <Box sx={{ 
          p: forPdf ? '4px 0' : 4,
          '& .MuiGrid-container': {
            marginBottom: forPdf ? '6px' : 2
          },
          // Ensure all content respects boundaries and renders properly
          '& .MuiBox-root': {
            wordWrap: 'break-word',
            marginBottom: forPdf ? '6px !important' : 'inherit'
          },
          '& .MuiTypography-root': {
            fontSize: forPdf ? '13px' : 'inherit',
            lineHeight: forPdf ? 1.4 : 'inherit',
            marginBottom: forPdf ? '3px !important' : 'inherit'
          }
        }}>
          
          {/* Bill To & Invoice Details */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: forPdf ? 2 : 4 }}>
              <Grid container spacing={forPdf ? 2 : 4}>
                <Grid item xs={12} md={6}>
          <Typography 
                    variant="h6"
            sx={{ 
              fontWeight: 'bold', 
                      color: '#2c3e50',
                      mb: 2,
                      ...noHyphenStyle,
            }}
          >
                    Bill To:
          </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      fontSize: forPdf ? '13px' : '16px',
                      lineHeight: forPdf ? 1.4 : 1.5,
                      ...noHyphenStyle 
                    }}>
                      {receiver.name || 'Client Name'}
          </Typography>
                    {receiver.address && (
                      <Typography variant="body2" sx={{ 
                        mb: 0.5, 
                        color: '#7f8c8d',
                        fontSize: forPdf ? '12px' : '14px',
                        lineHeight: forPdf ? 1.4 : 1.5,
                        ...noHyphenStyle 
                      }}>
                        {receiver.address}
            </Typography>
                    )}
                    {(receiver.city || receiver.state || receiver.zipCode) && (
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#7f8c8d', ...noHyphenStyle }}>
                        {[receiver.city, receiver.state, receiver.zipCode].filter(Boolean).join(', ')}
            </Typography>
                    )}
                    {receiver.country && (
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#7f8c8d', ...noHyphenStyle }}>
                        {receiver.country}
            </Typography>
                    )}
                    {receiver.email && (
                      <Typography variant="body2" sx={{ color: '#7f8c8d', ...noHyphenStyle }}>
                        {receiver.email}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      mb: 2,
                      ...noHyphenStyle,
                    }}
                  >
                    Invoice Details:
            </Typography>
                  <Box sx={{ pl: 2 }}>
                    {details.issueDate && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 'bold',
                          fontSize: forPdf ? '12px' : '14px',
                          lineHeight: forPdf ? 1.4 : 1.5,
                          ...noHyphenStyle 
                        }}>
                Issue Date:
              </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: forPdf ? '12px' : '14px',
                          lineHeight: forPdf ? 1.4 : 1.5,
                          ...noHyphenStyle 
                        }}>
                          {formatDate(details.issueDate)}
              </Typography>
                      </Box>
                    )}
                    {details.dueDate && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                Due Date:
              </Typography>
                        <Typography variant="body2" sx={{ ...noHyphenStyle }}>
                          {formatDate(details.dueDate)}
              </Typography>
                      </Box>
                    )}
                    {details.currency && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                Currency:
              </Typography>
                        <Typography variant="body2" sx={{ ...noHyphenStyle }}>
                          {details.currency}
              </Typography>
            </Box>
                    )}
                    {details.status && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                          Status:
          </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 'bold',
                          color: details.status === 'Paid' ? '#27ae60' : '#e74c3c',
                          ...noHyphenStyle 
                        }}>
                          {details.status}
                        </Typography>
        </Box>
                    )}
      </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Items Table - Professional Design */}
          <motion.div variants={itemVariants}>
            <Box 
              className="page-break-avoid"
              sx={{ 
                mb: forPdf ? '6px' : 4,
                mt: forPdf ? '6px' : 2,
                '& table': {
                  fontSize: forPdf ? '12px' : '14px'
                }
              }}
            >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
                color: '#2c3e50',
                mb: forPdf ? '6px' : 3,
                fontSize: forPdf ? '16px' : '18px',
                ...noHyphenStyle,
          }}
        >
                Items & Services:
        </Typography>
        
              <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Table sx={{ 
                  tableLayout: 'auto', // Use auto for better text fitting
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#2c3e50' }}>
                      <TableCell sx={{ 
                        color: 'white', 
            fontWeight: 'bold',
                        border: 'none',
                        fontSize: forPdf ? '13px' : '14px',
                        padding: forPdf ? '10px 8px' : '16px',
                        lineHeight: forPdf ? 1.4 : 1.5,
                        minWidth: forPdf ? '40%' : 'auto',
                        ...noHyphenStyle 
                      }}>
            Description
                      </TableCell>
                      <TableCell align="center" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        border: 'none',
                        fontSize: forPdf ? '13px' : '14px',
                        padding: forPdf ? '10px 6px' : '16px',
                        lineHeight: forPdf ? 1.4 : 1.5,
                        minWidth: forPdf ? '10%' : 'auto',
                        ...noHyphenStyle 
                      }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        border: 'none',
                        fontSize: forPdf ? '13px' : '14px',
                        padding: forPdf ? '10px 8px' : '16px',
                        lineHeight: forPdf ? 1.4 : 1.5,
                        minWidth: forPdf ? '25%' : 'auto',
                        ...noHyphenStyle 
                      }}>
                        Rate
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        border: 'none',
                        fontSize: forPdf ? '13px' : '14px',
                        padding: forPdf ? '10px 8px' : '16px',
                        lineHeight: forPdf ? 1.4 : 1.5,
                        minWidth: forPdf ? '25%' : 'auto',
                        ...noHyphenStyle 
                      }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items && items.length > 0 ? (
                      items.map((item, index) => (
                        <TableRow 
              key={index}
                  sx={{
                            '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' },
                            '&:hover': { bgcolor: '#f0f0f0' }
                          }}
                        >
                          <TableCell sx={{ 
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: forPdf ? '13px' : '14px',
                            padding: forPdf ? '10px 8px' : '16px',
                            verticalAlign: 'top',
                            lineHeight: forPdf ? 1.4 : 1.5,
                            ...noHyphenStyle 
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 'medium',
                              fontSize: forPdf ? '13px' : '14px',
                              lineHeight: forPdf ? 1.4 : 1.5,
                              marginBottom: 0,
                              ...noHyphenStyle 
                            }}>
                              {item.name || item.description || 'Item Description'}
                    </Typography>
                            {item.details && (
                              <Typography variant="caption" sx={{ 
                                color: '#7f8c8d',
                                fontSize: forPdf ? '11px' : '12px',
                                lineHeight: forPdf ? 1.3 : 1.4,
                                display: 'block',
                                marginTop: forPdf ? '2px' : '4px',
                                ...noHyphenStyle 
                              }}>
                                {item.details}
                      </Typography>
                    )}
                          </TableCell>
                          <TableCell align="center" sx={{ 
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: forPdf ? '13px' : '14px',
                            padding: forPdf ? '10px 6px' : '16px',
                            verticalAlign: 'top',
                            lineHeight: forPdf ? 1.4 : 1.5,
                            ...noHyphenStyle 
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 'medium',
                              fontSize: forPdf ? '13px' : '14px',
                              lineHeight: forPdf ? 1.4 : 1.5,
                              ...noHyphenStyle 
                            }}>
                              {item.quantity || 1}
                  </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: forPdf ? '13px' : '14px',
                            padding: forPdf ? '10px 8px' : '16px',
                            verticalAlign: 'top',
                            lineHeight: forPdf ? 1.4 : 1.5,
                            ...noHyphenStyle 
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 'medium',
                              fontSize: forPdf ? '12px' : '14px',
                              lineHeight: forPdf ? 1.4 : 1.5,
                              ...noHyphenStyle 
                            }}>
                              {formatNumberWithCommas(item.unitPrice || 0)}
                </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: forPdf ? '13px' : '14px',
                            padding: forPdf ? '10px 8px' : '16px',
                            verticalAlign: 'top',
                            lineHeight: forPdf ? 1.4 : 1.5,
                            ...noHyphenStyle 
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              fontSize: forPdf ? '12px' : '14px',
                              lineHeight: forPdf ? 1.4 : 1.5,
                              ...noHyphenStyle 
                            }}>
                              {formatNumberWithCommas(calculateItemTotal(item.unitPrice, item.quantity))}
                </Typography>
                          </TableCell>
                        </TableRow>
                      ))
        ) : (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#95a5a6', fontStyle: 'italic', ...noHyphenStyle }}>
                          No items added to this invoice
                        </TableCell>
                      </TableRow>
        )}
                  </TableBody>
                </Table>
              </Paper>
      </Box>
          </motion.div>

      {/* Totals Section */}
          <motion.div variants={itemVariants}>
        <Box
              className="totals-section page-break-avoid"
          sx={{
                mb: forPdf ? '6px' : 4,
                marginTop: forPdf ? '6px' : 3
              }}
            >
              <Grid container justifyContent="flex-end">
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ 
                    p: forPdf ? 1.5 : 3, 
                    bgcolor: '#f8f9fa', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1 
                  }}>
                    
            {/* Subtotal */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', ...noHyphenStyle }}>
                Subtotal:
              </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'medium', ...noHyphenStyle }}>
                        {details.currency || 'USD'} {formatNumberWithCommas(subTotal)}
              </Typography>
            </Box>
            
                                         {/* Additional Charges */}
                     {effectiveCharges.tax && Number(effectiveCharges.tax) > 0 && (
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                         <Typography variant="body2" sx={{ color: '#666', ...noHyphenStyle }}>
                           Tax ({Number(effectiveCharges.tax).toFixed(1)}%):
                </Typography>
                         <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#666', ...noHyphenStyle }}>
                           {details.currency || 'USD'} {formatNumberWithCommas(subTotal * (Number(effectiveCharges.tax) / 100))}
                </Typography>
              </Box>
            )}
            
                     {effectiveCharges.discount && Number(effectiveCharges.discount) > 0 && (
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                         <Typography variant="body2" sx={{ color: '#e74c3c', ...noHyphenStyle }}>
                           Discount:
                </Typography>
                         <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#e74c3c', ...noHyphenStyle }}>
                           -{details.currency || 'USD'} {formatNumberWithCommas(Number(effectiveCharges.discount))}
                </Typography>
              </Box>
            )}
            
                     {effectiveCharges.shipping && Number(effectiveCharges.shipping) > 0 && (
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                         <Typography variant="body2" sx={{ color: '#666', ...noHyphenStyle }}>
                           Shipping:
                </Typography>
                         <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#666', ...noHyphenStyle }}>
                           {details.currency || 'USD'} {formatNumberWithCommas(Number(effectiveCharges.shipping))}
                </Typography>
        </Box>
      )}
            
                                         {/* Show divider if there are additional charges */}
                     {((effectiveCharges.tax && Number(effectiveCharges.tax) > 0) || 
                       (effectiveCharges.discount && Number(effectiveCharges.discount) > 0) || 
                       (effectiveCharges.shipping && Number(effectiveCharges.shipping) > 0)) && (
                       <Divider sx={{ my: 2 }} />
                     )}

      {/* Total */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50', ...noHyphenStyle }}>
                Total Amount:
              </Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2c3e50', ...noHyphenStyle }}>
                        {details.currency || 'USD'} {formatNumberWithCommas(totalAmount)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Payment Terms */}
          {details.paymentTerms && (
            <motion.div variants={itemVariants}>
              <Box 
                className="page-break-avoid"
        sx={{
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 2, ...noHyphenStyle }}>
                  Payment Terms:
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ ...noHyphenStyle }}>
                    {details.paymentTerms}
      </Typography>
            </Box>
          </Box>
            </motion.div>
          )}

          {/* Payment Information */}
      {paymentInfo && Object.values(paymentInfo).some(val => val) && (
            <motion.div variants={itemVariants}>
                              <Box 
                className="payment-information page-break-avoid"
                sx={{ 
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
                    color: '#2c3e50',
                    mb: 2,
                    ...noHyphenStyle,
            }}
          >
                  Payment Information:
          </Typography>
          
                <Box sx={{ 
                  p: forPdf ? 2 : 3,
                  bgcolor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: 1,
                  fontSize: forPdf ? '11px' : '14px',
                  '& .MuiTypography-root': {
                    fontSize: forPdf ? '11px' : '14px',
                    lineHeight: forPdf ? 1.3 : 1.5
                  }
                                  }}>
                  <Grid container spacing={forPdf ? 2 : 3}>
            {/* Bank Details */}
            {(paymentInfo.bankName || paymentInfo.accountName || paymentInfo.accountNumber) && (
              <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 'bold', 
                          mb: forPdf ? 1 : 2, 
                          color: '#2c3e50',
                          fontSize: forPdf ? '11px' : '14px',
                          ...noHyphenStyle 
                        }}>
                          Bank Details:
                  </Typography>
                  
                  {paymentInfo.bankName && (
                          <Box sx={{ mb: forPdf ? 0.5 : 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 'bold', 
                              display: 'inline',
                              fontSize: forPdf ? '10px' : '14px',
                              ...noHyphenStyle 
                            }}>Bank Name: </Typography>
                            <Typography variant="body2" sx={{ 
                              display: 'inline',
                              fontSize: forPdf ? '10px' : '14px',
                              ...noHyphenStyle 
                            }}>{paymentInfo.bankName}</Typography>
                    </Box>
                  )}
                  
                  {paymentInfo.bankBranch && (
                    <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Branch: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', ...noHyphenStyle }}>{paymentInfo.bankBranch}</Typography>
                    </Box>
                  )}
                  
                  {paymentInfo.accountName && (
                    <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Account Name: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', ...noHyphenStyle }}>{paymentInfo.accountName}</Typography>
                    </Box>
                  )}
                  
                  {paymentInfo.accountNumber && (
                    <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Account Number: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.accountNumber}</Typography>
                    </Box>
                  )}
                  
                  {paymentInfo.swiftCode && (
                    <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>SWIFT/BIC: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.swiftCode}</Typography>
                    </Box>
                  )}
                  
                  {paymentInfo.routingNumber && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Routing Number: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.routingNumber}</Typography>
                    </Box>
                  )}
              </Grid>
            )}
            
                    {/* Online Payment */}
                    {(paymentInfo.paypalEmail || paymentInfo.merchantId || paymentInfo.additionalInstructions) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50', ...noHyphenStyle }}>
                          Online Payment Options:
                  </Typography>
                  
                    {paymentInfo.paypalEmail && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>PayPal: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', ...noHyphenStyle }}>{paymentInfo.paypalEmail}</Typography>
                        </Box>
                    )}
                    
                    {paymentInfo.merchantId && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Merchant ID: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.merchantId}</Typography>
                        </Box>
            )}
            
            {paymentInfo.additionalInstructions && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, ...noHyphenStyle }}>Payment Instructions:</Typography>
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                              p: 2,
                              bgcolor: 'white',
                              border: '1px solid #e9ecef',
                              borderRadius: 1,
                              ...noHyphenStyle 
                            }}>
                    {paymentInfo.additionalInstructions}
                  </Typography>
                </Box>
                        )}
              </Grid>
            )}
          </Grid>
        </Box>
              </Box>
            </motion.div>
      )}

          {/* Signature Section - Enhanced */}
          {details.signature && (
            <motion.div variants={itemVariants}>
              <Box 
                className="signature-area page-break-avoid"
            sx={{
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '10px' : 3
            }}
          >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
                    color: '#2c3e50',
                    mb: 2,
                    ...noHyphenStyle,
            }}
          >
                  Authorized Signature:
          </Typography>
                
          <Box sx={{ 
                  p: forPdf ? 2 : 3,
                  border: '1px solid #dee2e6',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: forPdf ? 80 : 120,
                  bgcolor: '#fafafa',
                  '& img': {
                    maxHeight: forPdf ? '60px' : '80px',
                    maxWidth: forPdf ? '200px' : '300px'
                  }
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
                                color: '#2c3e50',
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
                                color: '#2c3e50',
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
                                color: '#2c3e50',
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
                  <Box sx={{ borderTop: '1px solid #2c3e50', pt: 1, mt: 'auto' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#7f8c8d', ...noHyphenStyle }}>
                          Signature
          </Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#7f8c8d', ...noHyphenStyle }}>
                          Date: {formatDate(new Date())}
            </Typography>
                      </Grid>
                    </Grid>
          </Box>
        </Box>
              </Box>
            </motion.div>
      )}

          {/* Additional Notes */}
          {(details.additionalNotes || details.notes) && (
            <motion.div variants={itemVariants}>
              <Box 
                className="notes-section page-break-avoid"
            sx={{
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 2, ...noHyphenStyle }}>
                  Additional Notes:
          </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ ...noHyphenStyle }}>
                    {details.additionalNotes || details.notes}
            </Typography>
          </Box>
        </Box>
            </motion.div>
      )}
        </Box>

      {/* Footer */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            p: forPdf ? '12px 0' : 3,
            textAlign: 'center',
            borderTop: '1px solid #dee2e6',
            bgcolor: '#f8f9fa',
            marginTop: forPdf ? '8px' : '16px'
          }}>
            <Typography variant="body2" sx={{ 
              color: '#7f8c8d',
              ...noHyphenStyle 
            }}>
          Thank you for your business!
        </Typography>
      </Box>
        </motion.div>
    </Box>
    </motion.div>
    </>
  );
};

export default InvoiceTemplate1;
