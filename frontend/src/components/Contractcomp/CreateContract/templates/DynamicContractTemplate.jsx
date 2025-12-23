import React from 'react';
import { Box, Typography, Grid, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const DynamicContractTemplate = ({ 
  party1, 
  party2, 
  details, 
  financials, 
  legal, 
  approvals,
  signatures,
  forPdf = false 
}) => {
  // Professional legal document styles
  const documentStyles = {
    fontFamily: 'Times New Roman, serif',
    fontSize: forPdf ? '12px' : '14px',
    lineHeight: 1.6,
    color: '#000000',
    hyphens: 'auto',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'normal',
    maxWidth: '100%'
  };
  
  // Helper function to safely render text content
  const safeText = (text) => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return String(text);
    return '';
  };
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Number(amount) || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    } catch (error) {
      return '';
    }
  };

  // Get contract type display name
  const getContractTypeDisplay = (type) => {
    const types = {
      'service_agreement': 'SERVICE AGREEMENT',
      'consulting': 'CONSULTING AGREEMENT',
      'consulting_retainer': 'CONSULTING RETAINER AGREEMENT',
      'freelance': 'FREELANCE AGREEMENT',
      'maintenance': 'MAINTENANCE AGREEMENT',
      'fixed_price': 'FIXED PRICE CONTRACT',
      'time_and_materials': 'TIME & MATERIALS AGREEMENT',
      'retainer': 'RETAINER AGREEMENT',
      'software_license': 'SOFTWARE LICENSE AGREEMENT',
      'saas_agreement': 'SOFTWARE AS A SERVICE AGREEMENT',
      'license': 'LICENSE AGREEMENT',
      'employment': 'EMPLOYMENT AGREEMENT',
      'independent_contractor': 'INDEPENDENT CONTRACTOR AGREEMENT',
      'partnership': 'PARTNERSHIP AGREEMENT',
      'vendor_agreement': 'VENDOR AGREEMENT',
      'subscription': 'SUBSCRIPTION AGREEMENT',
      'nda': 'NON-DISCLOSURE AGREEMENT',
      'non_disclosure': 'CONFIDENTIALITY AGREEMENT',
      'other': 'CONTRACT AGREEMENT'
    };
    return types[type] || 'CONTRACT AGREEMENT';
  };

  // Helper to render a signature (mirrors invoice templates)
  const renderSignature = (sig, altText = 'Signature') => {
    if (!sig) return null;

    // If object signature
    if (typeof sig === 'object') {
      // Drawn / uploaded image (dataURL or data)
      if (sig.dataURL && typeof sig.dataURL === 'string' && sig.dataURL.startsWith('data:image')) {
        return (
          <img
            src={sig.dataURL}
            alt={altText}
            style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }}
          />
        );
      }
      if (sig.data && typeof sig.data === 'string' && sig.data.startsWith('data:image')) {
        return (
          <img
            src={sig.data}
            alt={altText}
            style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }}
          />
        );
      }

      // Typed signature with custom font
      if (sig.text) {
        return (
          <Typography
            sx={{
              fontFamily: sig.fontFamily || 'cursive',
              fontSize: '1.5rem',
              color: '#000',
              fontStyle: 'italic',
              ...documentStyles
            }}
          >
            {sig.text}
          </Typography>
        );
      }
    }

    // If plain string (legacy). Could be data URL or plain text.
    if (typeof sig === 'string') {
      if (sig.startsWith('data:image')) {
        return (
          <img
            src={sig}
            alt={altText}
            style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }}
          />
        );
      }
      return (
        <Typography
          sx={{ 
            fontFamily: 'cursive', 
            fontSize: '1.5rem',
            color: '#000', 
            fontStyle: 'italic',
            ...documentStyles 
          }}
        >
          {sig}
        </Typography>
      );
    }

    return null;
  };

  return (
    <>
      {forPdf && (
        <style>
          {`
            /* PDF-specific styles for professional contracts */
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
            .signature-area {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              min-height: 100px;
            }
            /* Remove any fancy styling for PDF */
            * {
              color: #000 !important;
              background-color: #fff !important;
              border-color: #000 !important;
            }
          `}
        </style>
      )}
      
      <Box
        id="contract-preview"
        className="contract-preview"
        sx={{
          bgcolor: '#ffffff',
          p: forPdf ? 4 : 5,
          minHeight: '100vh',
          maxWidth: '8.5in',
          width: '100%',
          mx: 'auto',
          lineHeight: 1.6,
          ...documentStyles,
          
          // Professional contract styling
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            fontFamily: 'Times New Roman, serif',
            fontWeight: 'bold',
            color: '#000',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '32px 0 20px 0',
            lineHeight: 1.4,
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          },
          
          '& p, & .MuiTypography-body1': {
            marginBottom: '16px',
            textAlign: 'justify',
            textIndent: '0.5in',
            lineHeight: 1.6,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box'
          },
          
          // Subsection headers (2.1, 2.2, etc.)
          '& .MuiTypography-body1[class*="fontWeight-bold"]': {
            textIndent: 0,
            marginTop: '24px',
            marginBottom: '12px',
            textAlign: 'left'
          },
          
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            margin: '20px 0',
            tableLayout: 'fixed'
          },
          
          '& th, & td': {
            border: '1px solid #000',
            padding: '12px',
            textAlign: 'left',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.5
          },
          
          '& th': {
            backgroundColor: '#f8f8f8',
            fontWeight: 'bold'
          },

          // Ensure all text elements wrap properly
          '& .MuiTypography-root': {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%'
          },

          // Fix for long words and URLs
          '& *': {
            maxWidth: '100%',
            boxSizing: 'border-box'
          }
        }}
      >
      
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, ...documentStyles }}>
          {getContractTypeDisplay(details?.contractType)}
        </Typography>
          
          {safeText(details?.title) && (
            <Typography variant="h5" sx={{ mb: 2, fontStyle: 'italic', ...documentStyles }}>
              {safeText(details.title)}
            </Typography>
          )}
          
          <Typography variant="body1" sx={{ mb: 1, ...documentStyles }}>
            Contract No: {safeText(details?.contractNumber) || 'N/A'}
        </Typography>
          
          <Typography variant="body1" sx={{ ...documentStyles }}>
            Effective Date: {formatDate(details?.startDate)}
          </Typography>
      </Box>

        <Divider sx={{ my: 3, borderColor: '#000', borderWidth: '1px' }} />

        {/* Parties Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'left', ...documentStyles }}>
            PARTIES
            </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, textIndent: 0, ...documentStyles }}>
            This Agreement is entered into between:
            </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                FIRST PARTY:
              </Typography>
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {safeText(party1?.name) || '[First Party Name]'}
              </Typography>
              {safeText(party1?.companyName) && (
                <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                  {safeText(party1.companyName)}
              </Typography>
            )}
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {safeText(party1?.address)}
            </Typography>
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {[safeText(party1?.city), safeText(party1?.state), safeText(party1?.zipCode)].filter(Boolean).join(', ')}
              </Typography>
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {safeText(party1?.country)}
              </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                SECOND PARTY:
              </Typography>
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {safeText(party2?.name) || '[Second Party Name]'}
              </Typography>
              {safeText(party2?.companyName) && (
                <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                  {safeText(party2.companyName)}
                </Typography>
              )}
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {safeText(party2?.address)}
        </Typography>
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {[safeText(party2?.city), safeText(party2?.state), safeText(party2?.zipCode)].filter(Boolean).join(', ')}
                </Typography>
              <Typography variant="body1" sx={{ textIndent: 0, ...documentStyles }}>
                {safeText(party2?.country)}
              </Typography>
            </Grid>
        </Grid>
        </Box>

        <Divider sx={{ my: 3, borderColor: '#000', borderWidth: '1px' }} />

        {/* Recitals */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'left', ...documentStyles }}>
            RECITALS
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, ...documentStyles }}>
            WHEREAS, the First Party desires to {details?.contractType === 'service_agreement' ? 'provide services' : 'enter into this agreement'} with the Second Party; and
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, ...documentStyles }}>
            WHEREAS, the Second Party agrees to the terms and conditions set forth herein;
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, ...documentStyles }}>
            NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:
            </Typography>
          </Box>

        <Divider sx={{ my: 3, borderColor: '#000', borderWidth: '1px' }} />

        {/* Contract Terms */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'left', ...documentStyles }}>
            TERMS AND CONDITIONS
          </Typography>

          {/* Reset section numbering */}
          {(() => {
            window.contractNextSectionNumber = 1;
            return null;
          })()}

          {/* 1. Term */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
            1. TERM OF AGREEMENT
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
            This Agreement shall commence on {formatDate(details?.startDate)} and shall continue until {formatDate(details?.endDate)}, unless terminated earlier in accordance with the provisions herein.
          </Typography>

          {(() => {
            window.contractNextSectionNumber = 2;
            return null;
          })()}

          {/* 2. Scope of Work */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
            2. SCOPE OF WORK
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
            {safeText(details?.description) || 'The specific scope of work shall be as mutually agreed upon by both parties.'}
          </Typography>

          {(() => {
            window.contractNextSectionNumber = 3;
            return null;
          })()}

      {/* Objectives */}
      {details?.objectives?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
                2.1 OBJECTIVES
              </Typography>
              {details.objectives.map((objective, index) => (
                <Typography key={index} variant="body1" sx={{ 
                  mb: 2, 
                  textAlign: 'justify', 
                  textIndent: '0.75in',
                  ...documentStyles
                }}>
                  {index + 1}. {safeText(typeof objective === 'string' ? objective : (objective?.title || objective?.text))}
                </Typography>
          ))}
        </Box>
      )}

      {/* Deliverables */}
      {details?.deliverables?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
                2.2 DELIVERABLES
          </Typography>
              {details.deliverables.map((deliverable, index) => (
                <Typography key={index} variant="body1" sx={{ 
                  mb: 2, 
                  textAlign: 'justify', 
                  textIndent: '0.75in',
                  ...documentStyles
                }}>
                  {index + 1}. {safeText(typeof deliverable === 'string' ? deliverable : (deliverable?.title || deliverable?.text))}
                </Typography>
              ))}
        </Box>
      )}

      {/* Milestones */}
      {details?.milestones?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
                2.3 MILESTONES
          </Typography>
            {details.milestones.map((milestone, index) => (
                <Typography key={index} variant="body1" sx={{ 
                  mb: 2, 
                  textAlign: 'justify', 
                  textIndent: '0.75in',
                  ...documentStyles
                }}>
                  {index + 1}. {safeText(typeof milestone === 'string' ? milestone : (milestone?.title || milestone?.text))}
                  {typeof milestone === 'object' && milestone?.deadline && (
                    <Typography component="span" sx={{ fontStyle: 'italic', ml: 1, ...documentStyles }}>
                      (Due: {formatDate(milestone.deadline)})
                    </Typography>
                  )}
              </Typography>
            ))}
        </Box>
      )}

          {/* 3. Compensation */}
          {(financials?.totalValue > 0 || safeText(financials?.paymentSchedule) || safeText(financials?.paymentMethod)) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
                3. COMPENSATION
              </Typography>
              
              {financials?.totalValue > 0 && (
                <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
                  In consideration for the services rendered, Second Party shall pay First Party the total amount of {formatCurrency(financials.totalValue, financials.currency)}.
                  {safeText(financials.paymentSchedule) && ` Payment shall be made according to the following schedule: ${safeText(financials.paymentSchedule)}.`}
                </Typography>
              )}

              {/* Payment Method */}
              {safeText(financials?.paymentMethod) && (
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
                  <strong>Payment Method:</strong> {safeText(financials.paymentMethod)}
                </Typography>
              )}

              {/* Retainer Amount */}
              {financials?.retainerAmount > 0 && (
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
                  <strong>Retainer Amount:</strong> {formatCurrency(financials.retainerAmount, financials.currency)} shall be paid upon execution of this Agreement.
              </Typography>
              )}

              {/* Late Fee */}
              {financials?.lateFee > 0 && (
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
                  <strong>Late Payment Fee:</strong> A late fee of {financials.lateFee}% per month shall be charged on overdue payments.
                </Typography>
              )}

              {/* Expense Reimbursement */}
              {financials?.expenseReimbursement && (
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
                  <strong>Expenses:</strong> All reasonable expenses incurred in the performance of services shall be reimbursed upon presentation of appropriate documentation.
                </Typography>
              )}

              {/* Financial Notes */}
              {safeText(financials?.notes) && (
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify', textIndent: '0.5in', fontWeight: 'bold', ...documentStyles }}>
                    Additional Financial Terms:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify', textIndent: '0.75in', lineHeight: 1.6, ...documentStyles }}>
                    {safeText(financials.notes)}
              </Typography>
            </Box>
          )}

              {(() => {
                window.contractNextSectionNumber = 4;
                return null;
              })()}
            </Box>
          )}

          {/* 4. Payment Terms */}
          {safeText(details?.paymentTerms) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, textIndent: 0, ...documentStyles }}>
                4. PAYMENT TERMS
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify', textIndent: '0.5in', ...documentStyles }}>
                {safeText(details.paymentTerms)}
              </Typography>
              {(() => {
                window.contractNextSectionNumber = 5;
                return null;
              })()}
            </Box>
          )}

          {/* Legal Clauses */}
          {legal && (
            <>
              {/* Dynamic section numbering based on previous sections */}
              {(() => {
                let sectionNumber = window.contractNextSectionNumber || 5; // Start after payment terms
                const sections = [];

                // Governing Law
                if (safeText(legal.jurisdiction)) {
                  sections.push(
                    <React.Fragment key="jurisdiction">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. GOVERNING LAW
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        This Agreement shall be governed by and construed in accordance with the laws of {safeText(legal.jurisdiction)}.
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Arbitration Clause
                if (legal.arbitrationClause) {
                  sections.push(
                    <React.Fragment key="arbitration">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. DISPUTE RESOLUTION
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        Any disputes arising from this Agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in {safeText(legal.jurisdiction) || 'the jurisdiction specified herein'}.
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Force Majeure Clause
                if (legal.forceMajeureClause) {
                  sections.push(
                    <React.Fragment key="forceMajeure">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. FORCE MAJEURE
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        Neither party shall be liable for any failure or delay in performance under this Agreement which is due to circumstances beyond their reasonable control, including but not limited to acts of God, war, terrorism, epidemic, government regulations, disasters, strikes, or other labor disputes.
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Intellectual Property
                if (safeText(legal.intellectualPropertyClause)) {
                  sections.push(
                    <React.Fragment key="intellectualProperty">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. INTELLECTUAL PROPERTY
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        {safeText(legal.intellectualPropertyClause)}
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Confidentiality
                if (safeText(legal.nonDisclosureClause)) {
                  sections.push(
                    <React.Fragment key="confidentiality">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. CONFIDENTIALITY
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        {safeText(legal.nonDisclosureClause)}
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Non-Compete
                if (safeText(legal.nonCompeteClause)) {
                  sections.push(
                    <React.Fragment key="nonCompete">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. NON-COMPETE AGREEMENT
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        {safeText(legal.nonCompeteClause)}
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Warranty & Liability
                if (safeText(legal.warrantyClause)) {
                  sections.push(
                    <React.Fragment key="warranty">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                        {sectionNumber}. WARRANTY AND LIABILITY
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        {safeText(legal.warrantyClause)}
                      </Typography>
                    </React.Fragment>
                  );
                  sectionNumber++;
                }

                // Store the next section number for subsequent sections
                window.contractNextSectionNumber = sectionNumber;
                
                return sections;
              })()}
            </>
          )}

          {/* Termination */}
          {safeText(details?.terminationClause) && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                {window.contractNextSectionNumber || 8}. TERMINATION
          </Typography>
              <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {safeText(details.terminationClause)}
          </Typography>
              {(() => {
                window.contractNextSectionNumber = (window.contractNextSectionNumber || 8) + 1;
                return null;
              })()}
            </>
      )}

      {/* Additional Terms */}
          {safeText(details?.additionalTerms) && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
                {window.contractNextSectionNumber || 9}. ADDITIONAL TERMS
          </Typography>
              <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {safeText(details.additionalTerms)}
          </Typography>
              {(() => {
                window.contractNextSectionNumber = (window.contractNextSectionNumber || 9) + 1;
                return null;
              })()}
            </>
          )}

          {/* General Provisions */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textIndent: 0, ...documentStyles }}>
            {window.contractNextSectionNumber || 10}. GENERAL PROVISIONS
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, ...documentStyles, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            This Agreement constitutes the entire agreement between the parties and supersedes all prior understandings and agreements. Any modifications must be in writing and signed by both parties. If any provision is found unenforceable, the remainder shall remain in full force and effect.
          </Typography>
        </Box>

        <Divider sx={{ my: 4, borderColor: '#000', borderWidth: '2px' }} />

      {/* Signature Section */}
        <Box sx={{ mt: 6, mb: 4, pageBreakInside: 'avoid' }}>
          <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', textIndent: 0, ...documentStyles }}>
            IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
        </Typography>
        
          <Box sx={{ mt: 6 }}>
            {/* First Party Signature */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-end',
                mb: 1
              }}>
                <Box sx={{ 
                  flex: 1,
                  maxWidth: '300px',
                  borderBottom: '1px solid #000',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  pb: 1
                }}>
                  {renderSignature(
                    signatures?.party1 || { dataURL: approvals?.party1Signature },
                    'First Party Signature'
                  )}
                </Box>
                <Box sx={{ ml: 4, minWidth: '150px' }}>
                  <Typography variant="body2" sx={{ mb: 1, ...documentStyles }}>
                    Date: ________________
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 1, ...documentStyles }}>
                {safeText(party1?.name) || '[First Party Name]'}
              </Typography>
              {safeText(party1?.position) && (
                <Typography variant="body2" sx={{ ...documentStyles }}>
                  {safeText(party1.position)}
                </Typography>
              )}
              {safeText(party1?.companyName) && (
                <Typography variant="body2" sx={{ ...documentStyles }}>
                  {safeText(party1.companyName)}
              </Typography>
              )}
            </Box>

            {/* Second Party Signature */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-end',
                mb: 1
              }}>
                <Box sx={{ 
                  flex: 1,
                  maxWidth: '300px',
                  borderBottom: '1px solid #000',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  pb: 1
                }}>
                  {renderSignature(
                    signatures?.party2 || { dataURL: approvals?.party2Signature },
                    'Second Party Signature'
                  )}
                </Box>
                <Box sx={{ ml: 4, minWidth: '150px' }}>
                  <Typography variant="body2" sx={{ mb: 1, ...documentStyles }}>
                    Date: ________________
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 1, ...documentStyles }}>
                {safeText(party2?.name) || '[Second Party Name]'}
              </Typography>
              {safeText(party2?.position) && (
                <Typography variant="body2" sx={{ ...documentStyles }}>
                  {safeText(party2.position)}
                </Typography>
              )}
              {safeText(party2?.companyName) && (
                <Typography variant="body2" sx={{ ...documentStyles }}>
                  {safeText(party2.companyName)}
              </Typography>
              )}
            </Box>
          </Box>
      </Box>

      {/* Footer */}
        <Box sx={{ 
          borderTop: '1px solid #000', 
          pt: 2, 
          mt: 4, 
          textAlign: 'center'
        }}>
          <Typography variant="body2" sx={{ ...documentStyles, fontSize: '10px' }}>
            Contract #{safeText(details?.contractNumber) || 'N/A'} | Generated on {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default DynamicContractTemplate; 