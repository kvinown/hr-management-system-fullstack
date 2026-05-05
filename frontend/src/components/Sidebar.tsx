import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import api from "../lib/axios";

interface SidebarProps {
	onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);

	let role = "";
	const token = localStorage.getItem("accessToken");
	if (token) {
		try {
			const decoded: any = jwtDecode(token);
			role = decoded.role;
		} catch (err) {}
	}

	const getLinkClass = (path: string) => {
		const isActive = location.pathname === path;
		return `block px-4 py-2.5 rounded-lg transition-all font-medium ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`;
	};

	// 🔥 Logika Logout
	const handleLogout = async () => {
		setLoading(true);
		try {
			const refreshToken = localStorage.getItem("refreshToken");
			if (refreshToken) {
				await api.post("/auth/logout", { refreshToken });
			}
		} catch (err) {
			console.error(err);
		} finally {
			localStorage.clear();
			navigate("/login");
		}
	};

	return (
		<div className="h-full bg-gray-900 dark:bg-[#020617] text-white w-64 flex flex-col shadow-2xl border-r border-transparent dark:border-gray-800 transition-colors duration-300">
			{/* HEADER */}
			<div className="p-6 flex justify-between items-center border-b border-gray-800">
				<h1 className="text-2xl font-extrabold tracking-wider">
					HR<span className="text-blue-500">System</span>
				</h1>
				{onClose && (
					<button
						onClick={onClose}
						className="md:hidden text-gray-400 hover:text-white p-1 rounded transition-colors focus:outline-none">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
			</div>

			{/* MENU LIST */}
			<nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
				<Link
					to="/"
					onClick={onClose}
					className={getLinkClass("/")}>
					Dashboard
				</Link>

				{role !== "EMPLOYEE" && (
					<>
						<div className="mt-8 mb-3 text-xs font-bold text-gray-500 uppercase px-4 tracking-wider">Master Data</div>
						<Link
							to="/departments"
							onClick={onClose}
							className={getLinkClass("/departments")}>
							Departments
						</Link>
						<Link
							to="/positions"
							onClick={onClose}
							className={getLinkClass("/positions")}>
							Positions
						</Link>
						<Link
							to="/shifts"
							onClick={onClose}
							className={getLinkClass("/shifts")}>
							Shifts
						</Link>
						<Link
							to="/employees"
							onClick={onClose}
							className={getLinkClass("/employees")}>
							Employees
						</Link>
					</>
				)}

				<div className="mt-8 mb-3 text-xs font-bold text-gray-500 uppercase px-4 tracking-wider">{role === "EMPLOYEE" ? "My Records" : "Transactions"}</div>
				<Link
					to="/attendances"
					onClick={onClose}
					className={getLinkClass("/attendances")}>
					{role === "EMPLOYEE" ? "My Attendance" : "Attendance Logs"}
				</Link>
				<Link
					to="/leaves"
					onClick={onClose}
					className={getLinkClass("/leaves")}>
					{role === "EMPLOYEE" ? "Leave Requests" : "Leave Approvals"}
				</Link>
				<Link
					to="/payrolls"
					onClick={onClose}
					className={getLinkClass("/payrolls")}>
					{role === "EMPLOYEE" ? "My Payslips" : "Payroll"}
				</Link>
			</nav>

			{/* 🔥 FOOTER (Logout Button) */}
			<div className="p-4 border-t border-gray-800">
				<button
					onClick={handleLogout}
					disabled={loading}
					className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white py-3 rounded-xl transition-all font-bold disabled:opacity-50">
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					{loading ? "Logging out..." : "Logout"}
				</button>
			</div>
		</div>
	);
}
