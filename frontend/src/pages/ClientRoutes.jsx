import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientManagement from '../components/Clientcomp/ClientManagement';

function ClientRoutes() {
  return (
    <Routes>
      <Route index element={<ClientManagement />} />
      {/* Future client-related routes can be added here */}
      {/* <Route path="new" element={<NewClient />} /> */}
      {/* <Route path=":id" element={<ClientDetails />} /> */}
      {/* <Route path=":id/edit" element={<EditClient />} /> */}
    </Routes>
  );
}

export default ClientRoutes; 