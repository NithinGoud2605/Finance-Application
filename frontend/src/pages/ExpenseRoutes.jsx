import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ExpensesPage from '../components/Dashcomp/Expenses';

const ExpenseRoutes = () => {
  return (
    <Routes>
      <Route index element={<ExpensesPage />} />
    </Routes>
  );
};

export default ExpenseRoutes;