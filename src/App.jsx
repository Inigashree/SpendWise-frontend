import { useEffect, useState } from 'react';
import './App.css';
import MonthlyReport from './MonthlyReport';
import ExpenseCategoryChart from './ExpenseCategoryChart';
import Reports from './Reports';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const API_URL = `${API_BASE_URL}/api/expenses`;
const INCOME_API_URL = `${API_BASE_URL}/api/incomes`;
const AUTH_API_URL = `${API_BASE_URL}/api/auth`;

function getToken() {
    return localStorage.getItem('spendwise_token');
}

async function apiFetch(url, options = {}) {
    const token = getToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    if (response.status === 401) {
        localStorage.removeItem('spendwise_token');
        window.location.reload();
    }

    return response;
}

function App() {
    const [token, setToken] = useState(() => getToken());
    const [authMode, setAuthMode] = useState('login');
    const [authForm, setAuthForm] = useState({
        fullName: '',
        email: '',
        password: ''
    });
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [activePage, setActivePage] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        title: '',
        amount: '',
        category: 'FOOD',
        date: new Date().toLocaleDateString('en-CA')
    });
    const [incomes, setIncomes] = useState([]);
    const [incomeLoading, setIncomeLoading] = useState(true);
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [editingIncomeId, setEditingIncomeId] = useState(null);

    const [incomeForm, setIncomeForm] = useState({
        source: '',
        type: 'SALARY',
        amount: '',
        date: new Date().toLocaleDateString('en-CA'),
        frequency: 'RECURRING'
    });

    async function handleAuth(event) {
        event.preventDefault();
        setAuthError('');
        setAuthLoading(true);

        try {
            const isRegister = authMode === 'register';

            // Registration remains available for regular users only.
            if (isRegister) {
                const response = await fetch(`${AUTH_API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authForm)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || data.error || 'Registration failed.'
                    );
                }

                if (!data.token) {
                    throw new Error('Registration response has no token.');
                }

                localStorage.setItem('spendwise_token', data.token);
                localStorage.setItem(
                    'spendwise_user',
                    data.fullName || data.name || authForm.fullName
                );
                setToken(data.token);
                return;
            }

            // First, authenticate through the administrator endpoint.
            const adminResponse = await fetch(
                `${AUTH_API_URL}/admin-login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: authForm.email,
                        password: authForm.password
                    })
                }
            );

            if (adminResponse.ok) {
                const adminData = await adminResponse.json();

                if (!adminData.token) {
                    throw new Error('Admin authentication response has no token.');
                }

                sessionStorage.setItem(
                    'spendwiseAdminToken',
                    adminData.token
                );

                // Do not leave a regular user's session active.
                localStorage.removeItem('spendwise_token');
                localStorage.removeItem('spendwise_user');

                window.location.assign('/admin/dashboard');
                return;
            }

            // Only fall back to user login for an authentication rejection.
            // Server errors should be displayed rather than hidden.
            if (![400, 401, 403, 404].includes(adminResponse.status)) {
                throw new Error('Admin login service is unavailable. Try again.');
            }

            const userResponse = await fetch(`${AUTH_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: authForm.email,
                    password: authForm.password
                })
            });

            const userData = await userResponse.json();

            if (!userResponse.ok) {
                throw new Error(
                    userData.message ||
                    userData.error ||
                    'Invalid email or password.'
                );
            }

            if (!userData.token) {
                throw new Error('User authentication response has no token.');
            }

            // Clear any previous administrator session.
            sessionStorage.removeItem('spendwiseAdminToken');

            localStorage.setItem('spendwise_token', userData.token);

            const displayName =
                userData.fullName ||
                userData.name ||
                userData.username ||
                authForm.email.split('@')[0];

            localStorage.setItem('spendwise_user', displayName);
            setToken(userData.token);
        } catch (err) {
            setAuthError(err.message || 'Could not connect to the server.');
        } finally {
            setAuthLoading(false);
        }
    }

    async function loadExpenses() {
        try {
            setError('');
            const response = await apiFetch(API_URL);

            if (!response.ok) {
                throw new Error('Could not load expenses.');
            }

            const data = await response.json();
            setExpenses(data);
        } catch {
            setError('Unable to connect to the backend. Check that Spring Boot is running.');
        } finally {
            setLoading(false);
        }
    }

    async function loadIncomes() {
        try {
            const response = await apiFetch(INCOME_API_URL);

            if (!response.ok) {
                throw new Error('Could not load income records.');
            }

            const data = await response.json();
            setIncomes(data);
        } catch (err) {
            setError(err.message || 'Unable to load income records.');
        } finally {
            setIncomeLoading(false);
        }
    }


    useEffect(() => {
        if (token) {
            loadExpenses();
            loadIncomes();
        } else {
            setLoading(false);
            setIncomeLoading(false);
        }
    }, [token]);

    async function addExpense(event) {
        event.preventDefault();

        try {
            setError('');


            const isEditing = editingId !== null;

            const response = await apiFetch(
                isEditing ? `${API_URL}/${editingId}` : API_URL,
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...form,
                        amount: Number(form.amount)
                    })
                }
            );


            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Could not save the expense.');
            }
            setEditingId(null);

            await loadExpenses();
            setForm({
                title: '',
                amount: '',
                category: 'FOOD',
                date: new Date().toLocaleDateString('en-CA')
            });
            setShowForm(false);
        } catch (err) {
            setError(err.message || 'Could not save the expense.');
        }
    }

    async function deleteExpense(id) {
        const confirmed = window.confirm(
            'Are you sure you want to delete this expense?'
        );

        if (!confirmed) return;

        try {
            setError('');

            const response = await apiFetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Could not delete the expense.');
            }

            await loadExpenses();
        } catch (err) {
            setError(err.message || 'Could not delete the expense.');
        }
    }
    async function editExpense(expense) {
        setForm({
            title: expense.title,
            amount: String(expense.amount),
            category: expense.category,
            date: expense.date
        });

        setEditingId(expense.id);
        setShowForm(true);
    }

    function resetIncomeForm() {
        setIncomeForm({
            source: '',
            type: 'SALARY',
            amount: '',
            date: new Date().toLocaleDateString('en-CA'),
            frequency: 'RECURRING'
        });

        setEditingIncomeId(null);
        setShowIncomeForm(false);
    }

    async function saveIncome(event) {
        event.preventDefault();

        try {
            setError('');

            const isEditing = editingIncomeId !== null;

            const response = await apiFetch(
                isEditing
                    ? `${INCOME_API_URL}/${editingIncomeId}`
                    : INCOME_API_URL,
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...incomeForm,
                        amount: Number(incomeForm.amount)
                    })
                }
            );

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Could not save income.');
            }

            await loadIncomes();
            resetIncomeForm();
        } catch (err) {
            setError(err.message || 'Could not save income.');
        }
    }

    function editIncome(income) {
        setIncomeForm({
            source: income.source,
            type: income.type,
            amount: String(income.amount),
            date: income.date,
            frequency: income.frequency
        });

        setEditingIncomeId(income.id);
        setShowIncomeForm(true);
    }

    async function deleteIncome(id) {
        const confirmed = window.confirm(
            'Are you sure you want to delete this income record?'
        );

        if (!confirmed) return;

        try {
            setError('');

            const response = await apiFetch(`${INCOME_API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Could not delete income.');
            }

            await loadIncomes();
        } catch (err) {
            setError(err.message || 'Could not delete income.');
        }
    }


    const total = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0), 0
    );

    const today = new Date();
    const monthTotal = expenses
        .filter(expense => {
            const date = new Date(`${expense.date}T00:00:00`);
            return date.getMonth() === today.getMonth()
                && date.getFullYear() === today.getFullYear();
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const totalIncome = incomes.reduce(
        (sum, income) => sum + Number(income.amount || 0),
        0
    );

    const monthIncome = incomes
        .filter(income => {
            const date = new Date(`${income.date}T00:00:00`);

            return date.getMonth() === today.getMonth()
                && date.getFullYear() === today.getFullYear();
        })
        .reduce(
            (sum, income) => sum + Number(income.amount || 0),
            0
        );

    const balance = totalIncome - total;
    const displayName = localStorage.getItem('spendwise_user') || (authForm.email ? authForm.email.split('@')[0] : 'there');
    const firstName = displayName.trim().split(/\s+/)[0] || 'there';
    const savingsRate = monthIncome > 0 ? Math.max(0, Math.min(100, ((monthIncome - monthTotal) / monthIncome) * 100)) : 0;
    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

    const money = amount =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    function navigateTo(page) {
        setActivePage(page);
        setShowForm(false);
        setShowIncomeForm(false);
        setEditingId(null);
        setEditingIncomeId(null);
    }

    if (!token) {
        return (
            <div className="auth-page">
                <section className="auth-showcase">
                    <div className="auth-showcase-top">
                        <div className="brand-lockup">
                            <div className="auth-brand">
                                <span className="sw-mark" aria-hidden="true">
                                    <svg viewBox="0 0 48 48" fill="none">
                                        <path d="M24 3 43 14v20L24 45 5 34V14L24 3Z" fill="currentColor" opacity=".15"/>
                                        <path d="M29 8 12 18l12 7-5 3 8 5 12-8-11-7 5-3-4-7Z" fill="currentColor"/>
                                        <path d="m8 32 11-7 8 5-11 7-8-5Z" fill="#8DE0B0"/>
                                        <path d="m26 18 9-5 5 3-9 5-5-3Z" fill="#8DE0B0"/>
                                    </svg>
                                </span>
                                <span>Spend<span className="brand-accent">Wise</span></span>
                            </div>
                            <span className="auth-tagline-small">SPEND SMART · LIVE BETTER</span>
                        </div>
                    </div>
                    <div className="auth-showcase-copy">
                        <p className="eyebrow">YOUR MONEY, WITH MORE MEANING</p>
                        <h1>Make every<br/>rupee <span>count.</span></h1>
                        <p className="showcase-description">Build better money habits with a clearer view of your spending, your savings, and the goals that matter to you.</p>
                        <ul className="auth-benefits">
                            <li><span>✓</span> See your financial picture at a glance</li>
                            <li><span>✓</span> Understand where your money goes</li>
                            <li><span>✓</span> Make progress toward saving more</li>
                        </ul>
                    </div>
                    <div className="auth-showcase-footer"><span>Clarity for today. Confidence for tomorrow.</span><span>SPENDWISE</span></div>
                </section>
                <section className="auth-panel">
                    <form className="auth-card" onSubmit={handleAuth}>
                        <p className="auth-eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'YOUR NEXT CHAPTER STARTS HERE'}</p>
                        <h2>{authMode === 'login' ? 'Sign in to SpendWise' : 'Create your account'}</h2>
                        <p className="auth-intro">{authMode === 'login' ? 'Enter your details to access your personal finance workspace.' : 'Set up your account and start making your money work smarter.'}</p>
                        {authMode === 'register' && (
                            <label>Full name
                                <input required autoComplete="name" placeholder="Enter your full name" value={authForm.fullName} onChange={e => setAuthForm({...authForm, fullName:e.target.value})}/>
                            </label>
                        )}
                        <label>Email address
                            <input required type="email" autoComplete="email" placeholder="Enter your email address" value={authForm.email} onChange={e => setAuthForm({...authForm, email:e.target.value})}/>
                        </label>
                        <label>Password
                            <input required type="password" minLength={8} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" value={authForm.password} onChange={e => setAuthForm({...authForm, password:e.target.value})}/>
                        </label>
                        {authError && <p role="alert" className="auth-error">{authError}</p>}
                        <button className="auth-submit" type="submit" disabled={authLoading}>{authLoading ? 'Please wait…' : authMode === 'login' ? 'Sign in to SpendWise  →' : 'Create my account  →'}</button>
                        <p className="auth-switch">{authMode === 'login' ? "New to SpendWise?" : 'Already have an account?'} <button type="button" onClick={() => {setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('');}}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
                        <div className="auth-security"><span>🔒</span> Your financial workspace is private and secure.</div>
                        <p className="auth-copyright">© {new Date().getFullYear()} SpendWise · Spend smart. Live better.</p>
                    </form>
                </section>
            </div>
        );
    }

    return (
        <div className="app">

            <aside className="sidebar">
                <h2 className="brand">
                    <span className="sw-mark" aria-hidden="true">
                        <svg viewBox="0 0 48 48" fill="none">
                            <path d="M24 3 43 14v20L24 45 5 34V14L24 3Z" fill="currentColor" opacity=".15"/>
                            <path d="M29 8 12 18l12 7-5 3 8 5 12-8-11-7 5-3-4-7Z" fill="currentColor"/>
                            <path d="m8 32 11-7 8 5-11 7-8-5Z" fill="#8DE0B0"/>
                            <path d="m26 18 9-5 5 3-9 5-5-3Z" fill="#8DE0B0"/>
                        </svg>
                    </span>
                    <span>Spend<span className="brand-accent">Wise</span></span>
                </h2>

                <p className="sidebar-label">WORKSPACE</p>

                <button
                    className={`nav-item ${
                        activePage === 'dashboard' ? 'nav-active' : ''
                    }`}
                    onClick={() => navigateTo('dashboard')}
                >
                    <span>▦</span> Dashboard
                </button>

                <button
                    className={`nav-item ${
                        activePage === 'transactions' ? 'nav-active' : ''
                    }`}
                    onClick={() => navigateTo('transactions')}
                >
                    <span>⇄</span> Transactions
                </button>

                <button
                    className={`nav-item ${
                        activePage === 'reports' ? 'nav-active' : ''
                    }`}
                    onClick={() => navigateTo('reports')}
                >
                    <span>▥</span> Reports
                </button>
                <button
                    className="nav-item"
                    onClick={() => {
                        localStorage.removeItem('spendwise_token');
                        localStorage.removeItem('spendwise_user');
                        setToken(null);
                        setExpenses([]);
                        setIncomes([]);

                        // Reset the authentication form
                        setAuthMode('login');
                        setAuthError('');
                        setAuthForm({
                            fullName: '',
                            email: '',
                            password: ''
                        });
                    }}
                >
                    Logout
                </button>
                <div className="sidebar-footer">
                    <p>PERSONAL FINANCE</p>
                    <span>Spend smarter. Live better.</span>
                </div>
            </aside>


            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h1>{activePage === 'dashboard' ? <>{greeting}, <span className="greeting-name">{firstName} 👋</span></> : activePage === 'transactions' ? 'Transactions' : 'Financial reports'}</h1>
                        <p>{activePage === 'dashboard' ? 'You’re building better money habits. Here’s your financial snapshot.' : activePage === 'transactions' ? 'Every transaction, organised in one place.' : 'Understand your financial trends and spending patterns.'}</p>
                    </div>
                    {activePage === 'transactions' && (
                        <div className="header-actions">

                            <button
                                className="add-button"
                                onClick={() => {
                                    setShowForm(true);
                                    setShowIncomeForm(false);
                                    setEditingId(null);
                                    setForm({
                                        title: '',
                                        amount: '',
                                        category: 'FOOD',
                                        date: new Date().toLocaleDateString('en-CA')
                                    });
                                }}
                            >
                                + Add Expense
                            </button>

                            <button
                                className="add-button income-add-button"
                                onClick={() => {
                                    setShowIncomeForm(true);
                                    setShowForm(false);
                                    setEditingIncomeId(null);
                                    setIncomeForm({
                                        source: '',
                                        type: 'SALARY',
                                        amount: '',
                                        date: new Date().toLocaleDateString('en-CA'),
                                        frequency: 'RECURRING'
                                    });
                                }}
                            >
                                + Add Income
                            </button>
                        </div>
                    )}




                </header>

                {error && <p role="alert" className="error-message">{error}</p>}

                {activePage === 'transactions' && showForm && (
                    <form className="content-card expense-form" onSubmit={addExpense}>
                        <h2>{editingId !== null ? 'Edit Expense' : 'Add a new expense'}</h2>

                        <label>
                            Title
                            <input
                                required
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Lunch"
                            />
                        </label>

                        <label>
                            Amount (₹)
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                placeholder="e.g. 250"
                            />
                        </label>

                        <label>
                            Category
                            <select
                                value={form.category}
                                onChange={e =>
                                    setForm({ ...form, category: e.target.value })
                                }
                            >
                                <option value="FOOD">Food</option>
                                <option value="TRAVEL">Travel</option>
                                <option value="SHOPPING">Shopping</option>
                                <option value="BILLS">Bills</option>
                                <option value="HEALTH">Health</option>
                                <option value="EDUCATION">Education</option>
                                <option value="ENTERTAINMENT">Entertainment</option>
                                <option value="HOUSING">Housing</option>
                                <option value="PERSONAL_CARE">Personal Care</option>
                                <option value="SUBSCRIPTIONS">Subscriptions</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </label>

                        <label>
                            Date
                            <input
                                required
                                type="date"
                                max={new Date().toLocaleDateString('en-CA')}
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </label>

                        <button className="add-button" type="submit">
                            {editingId !== null ? 'Update Expense' : 'Save Expense'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setForm({
                                    title: '',
                                    amount: '',
                                    category: 'FOOD',
                                    date: new Date().toLocaleDateString('en-CA')
                                });
                            }}
                        >
                            Cancel
                        </button>

                    </form>
                )}

                {activePage === 'transactions' && showIncomeForm && (
                    <form className="content-card expense-form" onSubmit={saveIncome}>
                        <h2>
                            {editingIncomeId !== null ? 'Edit Income' : 'Add New Income'}
                        </h2>

                        <label>
                            Income Source
                            <input
                                required
                                value={incomeForm.source}
                                onChange={e =>
                                    setIncomeForm({ ...incomeForm, source: e.target.value })
                                }
                                placeholder="e.g. Monthly Salary"
                            />
                        </label>

                        <label>
                            Income Type
                            <select
                                value={incomeForm.type}
                                onChange={e =>
                                    setIncomeForm({ ...incomeForm, type: e.target.value })
                                }
                            >
                                <option value="SALARY">Salary</option>
                                <option value="FREELANCE">Freelance</option>
                                <option value="BUSINESS">Business</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </label>

                        <label>
                            Amount (₹)
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={incomeForm.amount}
                                onChange={e =>
                                    setIncomeForm({ ...incomeForm, amount: e.target.value })
                                }
                                placeholder="e.g. 35000"
                            />
                        </label>

                        <label>
                            Date
                            <input
                                required
                                type="date"
                                max={new Date().toLocaleDateString('en-CA')}
                                value={incomeForm.date}
                                onChange={e =>
                                    setIncomeForm({ ...incomeForm, date: e.target.value })
                                }
                            />
                        </label>

                        <label>
                            Frequency
                            <select
                                value={incomeForm.frequency}
                                onChange={e =>
                                    setIncomeForm({ ...incomeForm, frequency: e.target.value })
                                }
                            >
                                <option value="RECURRING">Recurring</option>
                                <option value="ONE_TIME">One-time</option>
                            </select>
                        </label>

                        <button className="add-button" type="submit">
                            {editingIncomeId !== null ? 'Update Income' : 'Save Income'}
                        </button>

                        <button type="button" onClick={resetIncomeForm}>
                            Cancel
                        </button>
                    </form>
                )}

                {activePage === 'dashboard' && (
                    <>
                        <section className="summary-grid">
                            <article className="summary-card balance-card"><div className="metric-top"><span className="metric-icon">◈</span><p>AVAILABLE BALANCE</p></div><h2>{money(balance)}</h2><span>All recorded income minus expenses</span></article>
                            <article className="summary-card income-card"><div className="metric-top"><span className="metric-icon">↙</span><p>MONTHLY INCOME</p></div><h2>{money(monthIncome)}</h2><span>Income recorded this month</span></article>
                            <article className="summary-card spending-card"><div className="metric-top"><span className="metric-icon">↗</span><p>MONTHLY SPENDING</p></div><h2>{money(monthTotal)}</h2><span>Expenses recorded this month</span></article>
                            <article className="summary-card savings-card"><div className="metric-top"><span className="metric-icon">✳</span><p>SAVINGS RATE</p></div><h2>{monthIncome > 0 ? `${savingsRate.toFixed(0)}%` : '—'}</h2><div className="savings-track"><span style={{width: `${savingsRate}%`}}/></div><span>{monthIncome > 0 ? (savingsRate >= 20 ? 'Great momentum — keep it up!' : 'Every small step counts.') : 'Add income to see your savings rate.'}</span></article>
                        </section>
                        <section className="insight-banner"><span className="insight-icon">✦</span><div><strong>{monthIncome > 0 ? (monthTotal <= monthIncome ? `You have ${money(monthIncome - monthTotal)} left from this month’s income.` : 'Your spending is higher than this month’s recorded income.') : 'Your financial picture starts with one small step.'}</strong><p>{monthIncome > 0 ? `You’ve used ${((monthTotal / monthIncome) * 100).toFixed(0)}% of this month’s income on recorded expenses.` : 'Add your income and expenses to unlock personalised insights.'}</p></div></section>
                    </>
                )}

                {activePage === 'dashboard' && (
                    <>
                        <MonthlyReport
                            expenses={expenses}
                            incomes={incomes}
                        />

                        <ExpenseCategoryChart
                            expenses={expenses}
                        />
                    </>
                )}

                {activePage === 'reports' && (
                    <Reports
                        expenses={expenses}
                        incomes={incomes}
                    />
                )}
                {activePage === 'transactions' && (
                    <>
                        <section className="content-card">
                            <h2>Recent Transactions</h2>

                            {loading ? (
                                <p>Loading expenses...</p>
                            ) : expenses.length === 0 ? (
                                <p>No expenses yet. Click “Add Expense” to record your first one.</p>
                            ) : (
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {[...expenses]
                                            .sort((a, b) => b.id - a.id)
                                            .map(expense => (
                                                <tr key={expense.id}>
                                                    <td>{expense.title}</td>
                                                    <td>{expense.category}</td>
                                                    <td>{expense.date}</td>
                                                    <td>{money(Number(expense.amount))}</td>

                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="edit-button"
                                                                onClick={() => editExpense(expense)}
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="delete-button"
                                                                onClick={() => deleteExpense(expense.id)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>



                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section className="content-card">
                            <h2>Income History</h2>

                            {incomeLoading ? (
                                <p>Loading income records...</p>
                            ) : incomes.length === 0 ? (
                                <p>No income records yet. Click "Add Income" to get started.</p>
                            ) : (
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Frequency</th>
                                            <th>Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {[...incomes]
                                            .sort((a, b) => b.id - a.id)
                                            .map(income => (
                                                <tr key={income.id}>
                                                    <td>{income.source}</td>
                                                    <td>{income.type}</td>
                                                    <td>{income.date}</td>
                                                    <td>
                                                        {income.frequency === 'ONE_TIME'
                                                            ? 'One-time'
                                                            : 'Recurring'}
                                                    </td>
                                                    <td>{money(Number(income.amount))}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="edit-button"
                                                                onClick={() => editIncome(income)}
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="delete-button"
                                                                onClick={() => deleteIncome(income.id)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default App;