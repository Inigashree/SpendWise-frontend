import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminDashboard from "./pages/AdminDashboard";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />
                <Route path="/*" element={<App />} />
            </Routes>
        </BrowserRouter>
    );
}