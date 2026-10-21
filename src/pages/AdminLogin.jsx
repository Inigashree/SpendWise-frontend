
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8080";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("admin@spendwise.local");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/admin-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Admin login failed");
            }

            if (!data.token) {
                throw new Error("No authentication token received");
            }

            // Separate key: does not overwrite the regular user's token.
            sessionStorage.setItem("spendwiseAdminToken", data.token);
            navigate("/admin/dashboard", { replace: true });
        } catch (err) {
            setError(err.message || "Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="admin-login-page">
            <form className="admin-login-card" onSubmit={handleSubmit}>
                <h1>SpendWise Admin</h1>
                <p>Sign in to manage your application.</p>

                <label htmlFor="admin-email">Admin email</label>
                <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                />

                <label htmlFor="admin-password">Password</label>
                <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <p role="alert" className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Admin Sign In"}
                </button>
            </form>
        </main>
    );
}
