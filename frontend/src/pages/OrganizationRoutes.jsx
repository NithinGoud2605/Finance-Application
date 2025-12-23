/* --------------------------------------------------------------------------
 *  All "/organization/*" routes in one place
 * ------------------------------------------------------------------------ */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import OrganizationLayout      from './organization/OrganizationLayout';
import OrganizationDashboard   from './organization/OrganizationDashboard';
import TeamManagement          from './organization/TeamManagement';
import OrganizationSettings    from './organization/OrganizationSettings';
import BillingAndPlans         from './organization/BillingAndPlans';

export default function OrganizationRoutes() {
  return (
    <Routes>
      <Route element={<OrganizationLayout />}>
        <Route index              element={<OrganizationDashboard />} />
        <Route path="dashboard"   element={<OrganizationDashboard />} />
        <Route path="team"        element={<TeamManagement />} />
        <Route path="settings"    element={<OrganizationSettings />} />
        <Route path="billing"     element={<BillingAndPlans />} />
      </Route>
    </Routes>
  );
}
