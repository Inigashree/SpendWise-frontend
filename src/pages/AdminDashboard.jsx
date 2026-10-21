import "./AdminDashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("spendwiseAdminToken");

        if (!token) {
            navigate("/", { replace: true });
            return;
        }

        async function loadDashboard() {
            try {
                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [statsResponse, usersResponse] = await Promise.all([
                    fetch(`${API_URL}/api/admin/stats`, { headers }),
                    fetch(
                        `${API_URL}/api/admin/users?search=${encodeURIComponent(search)}`,
                        { headers }
                    ),
                ]);

                if (
                    [401, 403].includes(statsResponse.status) ||
                    [401, 403].includes(usersResponse.status)
                ) {
                    sessionStorage.removeItem("spendwiseAdminToken");
                    navigate("/", { replace: true });
                    return;
                }

                if (!statsResponse.ok || !usersResponse.ok) {
                    throw new Error("Could not load admin dashboard data");
                }

                const statsData = await statsResponse.json();
                const usersData = await usersResponse.json();

                setStats(statsData);
                setUsers(
                    Array.isArray(usersData.users) ? usersData.users : []
                );
            } catch (err) {
                setError(err.message || "Unable to load dashboard");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    },[navigate, search]);

    function logout() {
        sessionStorage.removeItem("spendwiseAdminToken");
        navigate("/", { replace: true });
    }

    if (loading) {
        return (
            <main className="admin-dashboard">
                <p>Loading admin dashboard...</p>
            </main>
        );
    }

    return (
        <main className="admin-dashboard">
            <header>
                <div>
                    <div className="brand-lockup">
                        <div className="auth-brand">
    <span className="sw-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path
            d="M24 3 43 14v20L24 45 5 34V14L24 3Z"
            fill="currentColor"
            opacity=".15"
        />
        <path
            d="M29 8 12 18l12 7-5 3 8 5 12-8-11-7 5-3-4-7Z"
            fill="currentColor"
        />
        <path d="m8 32 11-7 8 5-11 7-8-5Z" fill="#8DE0B0" />
        <path d="m26 18 9-5 5 3-9 5-5-3Z" fill="#8DE0B0" />
      </svg>
    </span>

                            <span>
      Spend<span className="brand-accent">Wise</span>
    </span>
                            <span className="admin-badge">ADMIN</span>

                        </div>

                    </div>

                    <p>Application overview and user management</p>
                </div>

                <button onClick={logout}>Admin Logout</button>
            </header>

            {error && <p role="alert">{error}</p>}

            {stats && (
                <section className="admin-stats">
                    <article className="admin-stat-card">
                        <h2>Total Users</h2>
                        <p>{stats.totalUsers ?? 0}</p>
                    </article>
                </section>
            )}

            <section>
                <h2>Registered Users</h2>

                {users.length === 0 ? (
                    <p>No registered users found.</p>
                ) : (
                    <div className="admin-table-wrapper">
                        <input
                            type="search"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <table>
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                            </tr>
                            </thead>

                            <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id ?? user.email ?? index}>
                                    <td>
                                        {user.fullName ?? user.name ?? "—"}
                                    </td>
                                    <td>{user.email ?? "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
