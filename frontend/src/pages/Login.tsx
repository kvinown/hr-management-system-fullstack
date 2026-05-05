import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// 🔥 Gunakan Custom Hook
	const { theme, toggleTheme } = useTheme();

	// 🔒 kalau sudah login, redirect
	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			navigate("/");
		}
	}, [navigate]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await api.post("/auth/login", { email, password });
			const { accessToken, refreshToken } = res.data;

			localStorage.setItem("accessToken", accessToken);
			localStorage.setItem("refreshToken", refreshToken);

			navigate("/");
		} catch (err: any) {
			alert(err.response?.data?.error || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		// Container utama mengikuti tema
		<div className="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 px-4">
			{/* 🔥 Tombol Toggle melayang di pojok kanan atas */}
			<div className="absolute top-6 right-6">
				<ThemeToggle
					theme={theme}
					toggleTheme={toggleTheme}
					className="bg-white dark:bg-gray-800 shadow-md p-3"
				/>
			</div>

			<form
				onSubmit={handleLogin}
				className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-transparent dark:border-gray-700 transition-colors">
				<div className="text-center mb-8">
					<h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-wider">
						HR<span className="text-blue-500">System</span>
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
				</div>

				<div className="mb-4">
					<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
					<input
						type="email"
						placeholder="admin@hrsystem.com"
						className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white transition-colors"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>

				<div className="mb-6">
					<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
					<input
						type="password"
						placeholder="••••••••"
						className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white transition-colors"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>

				<button
					disabled={loading}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-all disabled:opacity-50">
					{loading ? "Signing in..." : "Login"}
				</button>
			</form>
		</div>
	);
}
