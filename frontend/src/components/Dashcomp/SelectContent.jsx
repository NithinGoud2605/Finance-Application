import { Box, Select, MenuItem, ListSubheader, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { setCurrentOrganization } from '../../services/api';

export default function SelectContent() {
  const { user, setCurrentOrganization: setUserOrg } = useUser();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);

  const organizations = user?.organizations || [];
  const currentOrgId  = user?.currentOrganization?.id ?? '';

  /* ─── change handler ─── */
  const handleChange = async (e) => {
    const newOrgId = e.target.value;
    setLoading(true);
    setError(null);

    try {
      const { organization } = await setCurrentOrganization(newOrgId);
      // update localStorage so Axios interceptor uses new value immediately
      localStorage.setItem('lastOrgId', organization.id);
      // push into user‑context
      setUserOrg(organization);
    } catch (err) {
      setError(err.message || 'Failed to switch organization');
    } finally {
      setLoading(false);
    }
  };

  if (!organizations.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No organizations
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Select
        fullWidth
        size="small"
        value={currentOrgId}
        onChange={handleChange}
        displayEmpty
        disabled={loading}
      >
        <ListSubheader>Organizations</ListSubheader>
        {organizations.map((org) => (
          <MenuItem key={org.id} value={org.id}>
            {org.name}
          </MenuItem>
        ))}
      </Select>

      {loading && (
        <CircularProgress
          size={20}
          sx={{ position: 'absolute', right: 30, top: '50%', mt: '-10px' }}
        />
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
