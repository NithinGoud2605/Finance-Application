import React, { useState, useContext } from 'react';
import { Box, Table, TableBody, TableRow, TableCell, TextField, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../../shared-theme/ThemeContext'; // Adjust import path if necessary

const ExpenseForm = ({ onSubmit }) => {
  const [expense, setExpense] = useState({
    amount: '',
    date: '',
    category: '',
    description: ''
  });
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);

  const handleChange = (e) => {
    setExpense({ ...expense, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(expense);
    setExpense({ amount: '', date: '', category: '', description: '' });
  };

  return (
<Box
  sx={{
    border: '0px solid',
    borderColor: theme.palette.divider,
    borderRadius: '10px',
    boxShadow: 3, // 3D effect
    p: 1,
    mb: 1,
    mt: 1,
    borderTop: '2px solid',
    borderTopColor: theme.palette.divider,
  }}
>

      <form onSubmit={handleSubmit}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <TextField
                  label="Amount"
                  name="amount"
                  type="number"
                  value={expense.amount}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      color: mode === 'light' ? theme.palette.success.dark : theme.palette.success.light,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === 'light' ? theme.palette.success.main : theme.palette.success.light,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === 'light' ? theme.palette.success.dark : theme.palette.success.contrastText,
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  label="Date"
                  name="date"
                  type="date"
                  value={expense.date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      color: mode === 'light' ? theme.palette.info.dark : theme.palette.info.light,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.info.main,
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  label="Category"
                  name="category"
                  value={expense.category}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      color: theme.palette.warning.dark,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.warning.main,
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  label="Description"
                  name="description"
                  value={expense.description}
                  onChange={handleChange}
                  sx={{
                    '& .MuiInputBase-root': {
                      color: theme.palette.primary.dark,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.getContrastText(theme.palette.secondary.main),
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                    },
                  }}
                >
                  Add Expense
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </form>
    </Box>
  );
};

export default ExpenseForm;
