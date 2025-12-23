import { Navigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';
import AccessDenied from './AccessDenied';

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const { currentOrg } = useOrganization();
  const location = useLocation();

  if (!currentOrg) {
    return <Navigate to="/organization" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(currentOrg.role)) {
    return <AccessDenied />;
  }

  return children;
}
