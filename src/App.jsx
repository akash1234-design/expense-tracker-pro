import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Plus, Trash2, Download, AlertTriangle, Wallet, TrendingUp, Calendar } from 'lucide-react'

function App() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses')
    return saved? JSON.parse(saved) : []
  })

  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('budget')
    return saved? Number(saved) : 5000
  })

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [toast, setToast] = useState(null)

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('budget', budget.toString())
  }, [budget])

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Calculations
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonth = expenses
   .filter(e => e.date.startsWith(currentMonth))
   .reduce((sum, exp) => sum + exp.amount, 0)

  const highest = expenses.length > 0? Math.max(...expenses.map(e => e.amount)) : 0
  const budgetUsed = budget > 0? (totalSpent / budget) * 100 : 0
  const isOverBudget = budgetUsed >= 100
  const isNearBudget = budgetUsed >= 80 && budgetUsed < 100

  const categories = ['Food', 'Bills', 'Transport', 'Shopping', 'Health', 'Entertainment']
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316']

  const chartData = categories
   .map(cat => ({
      name: cat,
      value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
    }))
   .filter(d => d.value > 0)

  // Functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const addExpense = () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error')
      return
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter valid amount', 'error')
      return
    }

    const newExp = {
      id: Date.now(),
      title: title.trim(),
      amount: Number(amount),
      category,
      date
    }

    setExpenses([newExp,...expenses])
    setTitle('')
    setAmount('')
    showToast('Expense added successfully!')

    // Budget check
    const newTotal = totalSpent + Number(amount)
    if (newTotal >= budget && totalSpent < budget) {
      showToast('⚠️ Budget limit exceeded!', 'warning')
    } else if (newTotal >= budget * 0.8 && totalSpent < budget * 0.8) {
      showToast('⚠️ 80% of budget used', 'warning')
    }
  }

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id!== id))
    showToast('Expense deleted')
  }

  const exportToCSV = () => {
    if (expenses.length === 0) {
      showToast('No expenses to export', 'error')
      return
    }

    const headers = 'Title,Category,Amount,Date\n'
    const rows = expenses.map(e => `"${e.title}","${e.category}",${e.amount},"${e.date}"`).join('\n')
    const csvContent = headers + rows

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showToast('CSV exported successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === 'error'? 'bg-red-600' :
          toast.type === 'warning'? 'bg-orange-600' :
          'bg-green-600'
        }`}>
          {toast.type === 'warning' && <AlertTriangle size={18} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="text-blue-500" />
            ExpenseTracker Pro
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Budget Alert Banner */}
        {isOverBudget && (
          <div className="bg-red-900/50 border border-red-500 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-400">Budget Exceeded!</p>
              <p className="text-sm text-red-300">You've spent ₹{totalSpent} of ₹{budget} ({budgetUsed.toFixed(0)}%)</p>
            </div>
          </div>
        )}

        {isNearBudget &&!isOverBudget && (
          <div className="bg-orange-900/50 border border-orange-500 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertTriangle className="text-orange-400 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-orange-400">Budget Warning</p>
              <p className="text-sm text-orange-300">You've used {budgetUsed.toFixed(0)}% of your ₹{budget} budget</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${isOverBudget? 'bg-gradient-to-br from-red-600 to-red-800' : isNearBudget? 'bg-gradient-to-br from-orange-600 to-orange-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'} p-6 rounded-2xl shadow-lg transition-all`}>
            <p className={`${isOverBudget? 'text-red-200' : isNearBudget? 'text-orange-200' : 'text-blue-200'} text-sm mb-1`}>Total Spent</p>
            <p className="text-3xl font-bold">₹{totalSpent.toLocaleString()}</p>
            <div className="mt-2 bg-black/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1 opacity-80">of ₹{budget.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-lg">
            <p className="text-purple-200 text-sm mb-1">This Month</p>
            <p className="text-3xl font-bold">₹{thisMonth.toLocaleString()}</p>
            <p className="text-xs text-purple-200 mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              {expenses.filter(e => e.date.startsWith(currentMonth)).length} transactions
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-pink-800 p-6 rounded-2xl shadow-lg">
            <p className="text-pink-200 text-sm mb-1">Highest Expense</p>
            <p className="text-3xl font-bold">₹{highest.toLocaleString()}</p>
            <p className="text-xs text-pink-200 mt-2">
              {highest > 0? expenses.find(e => e.amount === highest)?.title : 'No data'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-lg">
            <p className="text-green-200 text-sm mb-1">Remaining Budget</p>
            <p className="text-3xl font-bold">₹{Math.max(budget - totalSpent, 0).toLocaleString()}</p>
            <p className="text-xs text-green-200 mt-2">
              {budgetUsed < 100? `${(100 - budgetUsed).toFixed(0)}% left` : 'Over budget'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Expense Form */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Monthly Budget</label>
                <input
                  type="number"
                  placeholder="Set budget"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <input
                type="text"
                placeholder="Expense title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addExpense()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />

              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addExpense()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  {categories.map(cat => <option key={cat}>{cat}</option>)}
                </select>

                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <button
                onClick={addExpense}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus size={20} /> Add Expense
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Expense Breakdown</h2>
            {chartData.length > 0? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ color: '#fff', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h- flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Wallet size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No expenses yet</p>
                  <p className="text-sm">Add one to see breakdown</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Expenses</h2>
            <button
              onClick={exportToCSV}
              disabled={expenses.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition text-sm active:scale-95"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="space-y-3 max-h- overflow-y-auto pr-2">
            {expenses.length === 0? (
              <div className="text-center py-12 text-gray-500">
                <Wallet size={48} className="mx-auto mb-3 opacity-50" />
                <p className="font-semibold">No expenses yet</p>
                <p className="text-sm">Start tracking by adding your first expense</p>
              </div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-600 transition">
                  <div className="flex-1">
                    <p className="font-semibold">{exp.title}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        exp.category === 'Food'? 'bg-blue-900 text-blue-300' :
                        exp.category === 'Bills'? 'bg-purple-900 text-purple-300' :
                        exp.category === 'Transport'? 'bg-pink-900 text-pink-300' :
                        exp.category === 'Shopping'? 'bg-orange-900 text-orange-300' :
                        exp.category === 'Health'? 'bg-green-900 text-green-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>{exp.category}</span>
                      <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">₹{exp.amount.toLocaleString()}</p>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="text-red-400 hover:text-red-500 transition active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
       .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default App