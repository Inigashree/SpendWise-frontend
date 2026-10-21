
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

function MonthlyReport({ expenses, incomes }) {
    const monthlyData = [];

    const today = new Date();

    // Show the current month and previous five months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth() - i,
            1
        );

        const year = date.getFullYear();
        const month = date.getMonth();

        const monthName = date.toLocaleDateString('en-IN', {
            month: 'short',
            year: '2-digit'
        });

        const monthlyExpenses = expenses
            .filter(expense => {
                const expenseDate = new Date(
                    `${expense.date}T00:00:00`
                );

                return expenseDate.getFullYear() === year
                    && expenseDate.getMonth() === month;
            })
            .reduce(
                (sum, expense) =>
                    sum + Number(expense.amount || 0),
                0
            );

        const monthlyIncome = incomes
            .filter(income => {
                const incomeDate = new Date(
                    `${income.date}T00:00:00`
                );

                return incomeDate.getFullYear() === year
                    && incomeDate.getMonth() === month;
            })
            .reduce(
                (sum, income) =>
                    sum + Number(income.amount || 0),
                0
            );

        monthlyData.push({
            month: monthName,
            Income: monthlyIncome,
            Expenses: monthlyExpenses
        });
    }

    const money = value =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);

    return (
        <section className="content-card report-card">
            <h2>Monthly Income vs. Expenses</h2>

            <p className="report-description">
                Compare your recorded income and expenses over the
                last six calendar months.
            </p>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={monthlyData}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 10,
                            bottom: 5
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="month" />

                        <YAxis
                            tickFormatter={value =>
                                value >= 1000
                                    ? `₹${value / 1000}k`
                                    : `₹${value}`
                            }
                        />

                        <Tooltip
                            formatter={value => money(value)}
                        />

                        <Legend />

                        <Line
                            type="monotone"
                            dataKey="Income"
                            stroke="#16805d"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 7 }}
                        />

                        <Line
                            type="monotone"
                            dataKey="Expenses"
                            stroke="#e76f51"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

export default MonthlyReport;
