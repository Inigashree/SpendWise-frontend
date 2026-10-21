
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
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

function ExpenseCategoryChart({ expenses }) {
    const categoryTotals = expenses.reduce((totals, expense) => {
        const category = expense.category || 'OTHER';

        totals[category] =
            (totals[category] || 0) + Number(expense.amount || 0);

        return totals;
    }, {});

    const chartData = Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .map(([category, amount]) => ({
            name: CATEGORY_LABELS[category] || category,
            amount
        }));

    const money = value =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);

    return (
        <section className="content-card report-card">
            <h2>Spending by Category</h2>

            <p className="report-description">
                See how your recorded expenses are distributed.
            </p>

            {chartData.length === 0 ? (
                <p>No expense data available to display yet.</p>
            ) : (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="amount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={105}
                                paddingAngle={3}
                            >
                                {chartData.map(item => {
                                    const category = Object.keys(
                                        CATEGORY_LABELS
                                    ).find(
                                        key =>
                                            CATEGORY_LABELS[key] === item.name
                                    );

                                    return (
                                        <Cell
                                            key={item.name}
                                            fill={
                                                CATEGORY_COLORS[category]
                                                || '#8d99ae'
                                            }
                                        />
                                    );
                                })}
                            </Pie>

                            <Tooltip
                                formatter={value => money(value)}
                            />

                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

export default ExpenseCategoryChart;
