import { useEffect, useState } from "react";
import api from "../lib/axios";
import DashboardCard from "../components/DashboardCard";
import { jwtDecode } from "jwt-decode";
import EmployeeDashboard from "./employee/EmployeeDashboard";

export default function Dashboard() {
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [role, setRole] = useState<string | null>(null);

	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				setRole((jwtDecode(token) as any).role);
			} catch (err) {}
		}
	}, []);

	useEffect(() => {
		if (role === "EMPLOYEE") {
			setLoading(false);
			return;
		}
		if (role) {
			api
				.get("/dashboard/summary")
				.then((res) => setData(res.data))
				.finally(() => setLoading(false));
		}
	}, [role]);

	if (loading) return <div className="p-6 text-gray-500 dark:text-gray-400">Loading data...</div>;

	// 🔥 Panggil komponen yang sudah dipisah!
	if (role === "EMPLOYEE") return <EmployeeDashboard />;

	if (!data) return <div className="p-6 text-red-500">Failed to load HR dashboard data</div>;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">HR Dashboard</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
				<DashboardCard
					title="Total Employees"
					value={data.totalEmployees}
				/>
				<DashboardCard
					title="Active Employees"
					value={data.activeEmployees}
				/>
				<DashboardCard
					title="Present Today"
					value={data.todayAttendance.present}
				/>
				<DashboardCard
					title="Late Today"
					value={data.todayAttendance.late}
				/>
				<DashboardCard
					title="Absent Today"
					value={data.todayAttendance.absent}
				/>
				<DashboardCard
					title="Total Salary (This Month)"
					value={`Rp ${data.payroll.totalSalaryThisMonth.toLocaleString()}`}
				/>
				<DashboardCard
					title="Overtime (Minutes)"
					value={data.overtime.totalOvertimeMinutes}
				/>
			</div>
		</div>
	);
}
