import { useEffect, useState } from "react";
import api from "../lib/axios";
import DashboardCard from "../components/DashboardCard";
import { jwtDecode } from "jwt-decode";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import { Users, UserCheck, Clock, XCircle, DollarSign, Timer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// 🔥 Dummy Data untuk Grafik (Agar UI terlihat penuh sesuai referensi)
const weeklyAttendanceData = [
	{ name: "Mon", present: 45, late: 5, absent: 2 },
	{ name: "Tue", present: 48, late: 2, absent: 2 },
	{ name: "Wed", present: 47, late: 3, absent: 2 },
	{ name: "Thu", present: 40, late: 10, absent: 2 },
	{ name: "Fri", present: 50, late: 1, absent: 1 },
];

const departmentData = [
	{ name: "IT", value: 15 },
	{ name: "HR", value: 5 },
	{ name: "Finance", value: 8 },
	{ name: "Marketing", value: 12 },
	{ name: "Operations", value: 20 },
];
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

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

	if (loading)
		return (
			<div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);

	// TAMPILAN EMPLOYEE
	if (role === "EMPLOYEE") return <EmployeeDashboard />;

	// TAMPILAN HR ADMIN
	if (!data) return <div className="p-6 text-red-500">Failed to load HR dashboard data</div>;

	return (
		<div className="space-y-6 animate-fade-in">
			{/* ========================================= */}
			{/* BAGIAN 1: STATISTIC CARDS (DATA ASLI DARI API) */}
			{/* ========================================= */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
				<DashboardCard
					title="Total Employees"
					value={data.totalEmployees}
					icon={<Users size={24} />}
					trend="All registered staff"
					trendUp={true}
				/>
				<DashboardCard
					title="Present Today"
					value={data.todayAttendance.present}
					icon={<UserCheck size={24} />}
					trend={`${data.activeEmployees - data.todayAttendance.present} not clocked in yet`}
					trendUp={true}
				/>
				<DashboardCard
					title="Total Salary (This Month)"
					value={`Rp ${(data.payroll.totalSalaryThisMonth / 1000000).toFixed(1)}M`}
					icon={<DollarSign size={24} />}
					trend="Estimated payout"
					trendUp={false}
				/>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
				<DashboardCard
					title="Active"
					value={data.activeEmployees}
					icon={<Users size={20} />}
				/>
				<DashboardCard
					title="Late Today"
					value={data.todayAttendance.late}
					icon={<Clock size={20} />}
				/>
				<DashboardCard
					title="Absent Today"
					value={data.todayAttendance.absent}
					icon={<XCircle size={20} />}
				/>
				<DashboardCard
					title="Overtime (Mins)"
					value={data.overtime.totalOvertimeMinutes}
					icon={<Timer size={20} />}
				/>
			</div>

			{/* ========================================= */}
			{/* BAGIAN 2: CHARTS & VISUALIZATIONS */}
			{/* ========================================= */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* BAR CHART: Weekly Attendance */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
					<h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-6">Attendance Trend (This Week)</h3>
					<div className="h-72 w-full">
						<ResponsiveContainer
							width="100%"
							height="100%">
							<BarChart
								data={weeklyAttendanceData}
								margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#374151"
									opacity={0.2}
								/>
								<XAxis
									dataKey="name"
									tick={{ fontSize: 12, fill: "#6B7280" }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 12, fill: "#6B7280" }}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip
									cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
									contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
								/>
								<Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
								<Bar
									dataKey="present"
									name="On Time"
									fill="#10b981"
									radius={[4, 4, 0, 0]}
								/>
								<Bar
									dataKey="late"
									name="Late"
									fill="#f59e0b"
									radius={[4, 4, 0, 0]}
								/>
								<Bar
									dataKey="absent"
									name="Absent"
									fill="#ef4444"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* PIE CHART: Department Distribution */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
					<h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Workforce Distribution</h3>
					<div className="flex-grow flex items-center justify-center h-64">
						<ResponsiveContainer
							width="100%"
							height="100%">
							<PieChart>
								<Pie
									data={departmentData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={80}
									paddingAngle={5}
									dataKey="value">
									{departmentData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
								<Legend wrapperStyle={{ fontSize: "12px" }} />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
