import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ExpenseContext = createContext();

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses ko ExpenseProvider ke andar use karo');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useLocalStorage('expenses', []);

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount),
      createdAt: new Date().toISOString()
    };
    setExpenses([newExpense,...expenses]);
  };

  const updateExpense = (id, updatedExpense) => {
    setExpenses(
      expenses.map((exp) =>
        exp.id === id
          ? { ...exp, ...updatedExpense, amount: parseFloat(updatedExpense.amount), id: id }
          : exp
      )
    );
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter((exp) => exp.id!== id));
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, exp) => total + exp.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryMap = {};
    expenses.forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    return categoryMap;
  };

  const getExpensesByMonth = (month, year) => {
    return expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === month && expDate.getFullYear() === year;
    });
  };

  const value = {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getTotalExpenses,
    getExpensesByCategory,
    getExpensesByMonth
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};