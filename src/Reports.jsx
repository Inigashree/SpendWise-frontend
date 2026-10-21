
import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const CATEGORY_COLORS = {
    FOOD: '#f4a261',
    TRAVEL: '#457b9d',
    SHOPPING: '#9b5de5',
    BILLS: '#e76f51',
    HEALTH: '#2a9d8f',
    EDUCATION: '#3a86ff',
    ENTERTAINMENT: '#ff006e',
    HOUSING: '#8338ec',
    PERSONAL_CARE: '#06d6a0',
    SUBSCRIPTIONS: '#ffbe0b',
    OTHER: '#8d99ae'
};

const CATEGORY_LABELS = {
    FOOD: 'Food',
    TRAVEL: 'Travel',
    SHOPPING: 'Shopping',
    BILLS: 'Bills',
    HEALTH: 'Health',
    EDUCATION: 'Education',
    ENTERTAINMENT: 'Entertainment',
    HOUSING: 'Housing',
    PERSONAL_CARE: 'Personal Care',
    SUBSCRIPTIONS: 'Subscriptions',
    OTHER: 'Other'
};
function Reports({ expenses, incomes }) {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, '0')}`;
    });

    const [year, month] = selectedMonth.split('-').map(Number);

    const matchesMonth = record => {
        if (!record.date) return false;

        const [recordYear, recordMonth] = record.date
            .slice(0, 7)
            .split('-')
            .map(Number);

        return recordYear === year && recordMonth === month;
    };

    const monthlyExpenses = expenses.filter(matchesMonth);
    const monthlyIncomes = incomes.filter(matchesMonth);

    const totalExpenses = monthlyExpenses.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const totalIncome = monthlyIncomes.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const netCashFlow = totalIncome - totalExpenses;

    const categoryTotals = monthlyExpenses.reduce((totals, item) => {
        const category = item.category || 'OTHER';

        totals[category] =
            (totals[category] || 0) + Number(item.amount || 0);

        return totals;
    }, {});

    const categoryData = Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .map(([category, amount]) => ({
            category,
            name: CATEGORY_LABELS[category] || category,
            amount
        }));

    const money = value =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);

    const monthLabel = new Date(year, month - 1, 1)
        .toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric'
        });

    return (
        <div className="reports-page">
            <header className="reports-header">
                <div>
                    <h2>Monthly Reports</h2>
                    <p>Understand your income and spending.</p>
                </div>

                <label>
                    Select Month
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={event =>
                            setSelectedMonth(event.target.value)
                        }
                    />
                </label>
            </header>

            <h3>{monthLabel} Overview</h3>

            <section className="summary-grid">
                <article className="summary-card">
                    <p>Total Income</p>
                    <h2>{money(totalIncome)}</h2>
                </article>

                <article className="summary-card">
                    <p>Total Expenses</p>
                    <h2>{money(totalExpenses)}</h2>
                </article>

                <article className="summary-card">
                    <p>Net Cash Flow</p>
                    <h2>{money(netCashFlow)}</h2>
                    <span>
                        {netCashFlow >= 0
                            ? 'Positive cash flow'
                            : 'Spending exceeds income'}
                    </span>
                </article>
            </section>

            <section className="reports-grid">
                <article className="content-card">
                    <h3>Income vs. Expenses</h3>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    {
                                        name: monthLabel,
                                        Income: totalIncome,
                                        Expenses: totalExpenses
                                    }
                                ]}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={value => money(value)}
                                />
                                <Legend />
                                <Bar
                                    dataKey="Income"
                                    fill="#16805d"
                                />
                                <Bar
                                    dataKey="Expenses"
                                    fill="#e76f51"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="content-card">
                    <h3>Spending by Category</h3>

                    {categoryData.length === 0 ? (
                        <p>No expenses recorded for this month.</p>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        dataKey="amount"
                                        nameKey="name"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                    >
                                        {categoryData.map(item => (
                                            <Cell
                                                key={item.category}
                                                fill={
                                                    CATEGORY_COLORS[
                                                        item.category
                                                        ] || '#8d99ae'
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={value => money(value)}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </article>
            </section>

            <section className="content-card">
                <h3>Monthly Expense Details</h3>

                {monthlyExpenses.length === 0 ? (
                    <p>No expenses recorded for {monthLabel}.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                            </tr>
                            </thead>
                            <tbody>
                            {[...monthlyExpenses]
                                .sort((a, b) =>
                                    b.date.localeCompare(a.date)
                                )
                                .map(item => (
                                    <tr key={item.id}>
                                        <td>{item.date}</td>
                                        <td>{item.title}</td>
                                        <td>
                                            {CATEGORY_LABELS[
                                                item.category
                                                ] || item.category}
                                        </td>
                                        <td>{money(Number(item.amount))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Reports;
