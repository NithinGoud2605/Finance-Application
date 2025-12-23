import React, { useState } from 'react';
import { Button, Menu, MenuItem, Divider } from '@mui/material';
import AddIcon      from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';

import { useOrganization } from '../../contexts/OrganizationContext';
import CreateOrganizationDialog from '../CreateOrganizationDialog';   // ⬅️ import the wizard

export default function OrganizationSelector() {
  const {
    currentOrg,
    organizations,
    switchOrganization,
    addOrganization
  } = useOrganization();

  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ───── menu helpers ───── */
  const openMenu  = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = ()  => setAnchorEl(null);

  const showDialog = () => { closeMenu(); setDialogOpen(true); };
  const hideDialog = () => setDialogOpen(false);

  /* one‑org policy */
  const mayCreate = organizations.length === 0;

  /* ───── dialog “Create” handler ───── */
  const handleCreate = async (formData) => {
    await addOrganization(formData);
    hideDialog();
  };

  return (
    <>
      <Button
        onClick={openMenu}
        startIcon={<BusinessIcon />}
        color="inherit"
        sx={{ textTransform: 'none', minWidth: 200, justifyContent: 'flex-start' }}
      >
        {currentOrg?.name || 'Select organisation'}
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {organizations.map((org) => (
          <MenuItem
            key={org.id}
            selected={org.id === currentOrg?.id}
            onClick={() => { switchOrganization(org.id); closeMenu(); }}
          >
            {org.name}
          </MenuItem>
        ))}

        {organizations.length === 0 && (
          <>
            <Divider />
            <MenuItem onClick={showDialog}>
              <AddIcon sx={{ mr: 1 }} /> Create organisation
            </MenuItem>
          </>
        )}
      </Menu>

      {/* full wizard – collects name, type, size, industry, description */}
      <CreateOrganizationDialog
        open={dialogOpen}
        onClose={hideDialog}
        onCreate={handleCreate}
      />
    </>
  );
}
