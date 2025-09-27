'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, User } from '@/types';
import { Plus, DollarSign, Users, Calendar, Check, X } from 'lucide-react';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'food' as const,
    splitType: 'equal' as const,
    selectedUsers: [] as string[]
  });

  useEffect(() => {
    if (!user) return;

    // Fetch all users
    const fetchUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    };

    // Listen to expenses
    const expensesQuery = query(
      collection(db, 'expenses'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Expense[];
      
      // Filter expenses where user is involved
      const userExpenses = expensesData.filter(expense => 
        expense.paidBy === user.id || expense.sharedWith.includes(user.id)
      );
      
      setExpenses(userExpenses);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubscribe();
  }, [user]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newExpense.description || !newExpense.amount) return;

    const amount = parseFloat(newExpense.amount);
    const sharedWith = newExpense.selectedUsers.length > 0 
      ? newExpense.selectedUsers 
      : [user.id];

    try {
      await addDoc(collection(db, 'expenses'), {
        description: newExpense.description,
        amount,
        category: newExpense.category,
        paidBy: user.id,
        sharedWith,
        splitType: newExpense.splitType,
        createdAt: new Date(),
        settledBy: [],
        isSettled: false
      });

      // Reset form
      setNewExpense({
        description: '',
        amount: '',
        category: 'food',
        splitType: 'equal',
        selectedUsers: []
      });
      setShowAddExpense(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleSettleExpense = async (expenseId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        settledBy: arrayUnion(user.id)
      });
    } catch (error) {
      console.error('Error settling expense:', error);
    }
  };

  const getExpenseShare = (expense: Expense) => {
    if (expense.splitType === 'equal') {
      return expense.amount / expense.sharedWith.length;
    }
    return expense.customSplits?.[user?.id || ''] || 0;
  };

  const getUserBalance = () => {
    let balance = 0;
    expenses.forEach(expense => {
      if (expense.paidBy === user?.id) {
        // User paid, so they are owed money
        balance += expense.amount - getExpenseShare(expense);
      } else if (expense.sharedWith.includes(user?.id || '')) {
        // User owes money
        const userShare = getExpenseShare(expense);
        if (!expense.settledBy?.includes(user?.id || '')) {
          balance -= userShare;
        }
      }
    });
    return balance;
  };

  const categories = [
    { value: 'food', label: 'Food', emoji: '🍕' },
    { value: 'utilities', label: 'Utilities', emoji: '💡' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { value: 'groceries', label: 'Groceries', emoji: '🛒' },
    { value: 'other', label: 'Other', emoji: '📦' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const balance = getUserBalance();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600">Split bills and track expenses with friends</p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Balance</h3>
              <p className="text-sm text-gray-600">Overall balance across all expenses</p>
            </div>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {balance > 0 ? 'You are owed money' : balance < 0 ? 'You owe money' : 'All settled up!'}
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          </div>
          
          {expenses.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first expense to split with friends</p>
              <button
                onClick={() => setShowAddExpense(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {expenses.map((expense) => {
                const paidByUser = users.find(u => u.id === expense.paidBy);
                const userShare = getExpenseShare(expense);
                const isSettledByUser = expense.settledBy?.includes(user?.id || '');
                const isUserPayer = expense.paidBy === user?.id;
                
                return (
                  <div key={expense.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-100 rounded-lg p-2">
                          <span className="text-lg">
                            {categories.find(c => c.value === expense.category)?.emoji || '📦'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {expense.description}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(expense.createdAt)}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {expense.sharedWith.length} people
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Paid by {paidByUser?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Your share: {formatCurrency(userShare)}
                        </div>
                        
                        {!isUserPayer && !isSettledByUser && (
                          <button
                            onClick={() => handleSettleExpense(expense.id)}
                            className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Settle</span>
                          </button>
                        )}
                        
                        {isSettledByUser && (
                          <div className="mt-2 text-green-600 text-sm flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Settled
                          </div>
                        )}
                        
                        {isUserPayer && (
                          <div className="mt-2 text-blue-600 text-sm">
                            You paid
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Expense</h3>
                  <button
                    onClick={() => setShowAddExpense(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="What was this expense for?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split with (optional)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {users.filter(u => u.id !== user?.id).map(u => (
                      <label key={u.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newExpense.selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewExpense({
                                ...newExpense,
                                selectedUsers: [...newExpense.selectedUsers, u.id]
                              });
                            } else {
                              setNewExpense({
                                ...newExpense,
                                selectedUsers: newExpense.selectedUsers.filter(id => id !== u.id)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{u.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to only include yourself
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}