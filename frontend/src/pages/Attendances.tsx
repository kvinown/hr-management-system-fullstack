import { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import { jwtDecode } from "jwt-decode";
import EmployeeAttendance from "./employee/EmployeeAttendance";
import * as XLSX from "xlsx"; // 🔥 Import library Excel

export default function Attendances() {
	const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
	const [role, setRole] = useState("");
	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				const decoded: any = jwtDecode(token);
				setRole(decoded.role);
			} catch (err) {}
		}
	}, []);

	const [attendances, setAttendances] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [pagination, setPagination] = useState<any>(null);

	const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 3, 30));
	const [currentMonth, setCurrentMonth] = useState<number>(3);
	const [currentYear, setCurrentYear] = useState<number>(2026);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchDailyAttendance = useCallback(async () => {
		setLoading(true);
		const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
		const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

		try {
			const res = await api.get("/attendances", { params: { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString(), page, limit } });
			setAttendances(res.data.data || []);
			setPagination(res.data.pagination);
		} catch (err: any) {
			console.error("Failed to fetch attendances", err);
		} finally {
			setLoading(false);
		}
	}, [selectedDate, page, limit]);

	const getImageUrl = (path: string | null) => {
		if (!path) return null;
		const host = window.location.hostname;
		return `http://${host}:5000${path}`;
	};

	useEffect(() => {
		fetchDailyAttendance();
	}, [fetchDailyAttendance]);

	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

	const handlePrevMonth = () => {
		if (currentMonth === 0) {
			setCurrentMonth(11);
			setCurrentYear((prev) => prev - 1);
		} else setCurrentMonth((prev) => prev - 1);
	};

	const handleNextMonth = () => {
		if (currentMonth === 11) {
			setCurrentMonth(0);
			setCurrentYear((prev) => prev + 1);
		} else setCurrentMonth((prev) => prev + 1);
	};

	const handleDateClick = (day: number) => {
		setSelectedDate(new Date(currentYear, currentMonth, day));
		setPage(1);
	};

	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const formatTime = (dateString: string | null) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
	};

	const filteredAttendances = attendances.filter((a) => {
		const empName = a.employee?.user?.name || "";
		return empName.toLowerCase().includes(searchQuery.toLowerCase());
	});

	// 🔥 FUNGSI EXPORT KE EXCEL
	const handleExportExcel = () => {
		const exportData = filteredAttendances.map((a) => ({
			Date: new Date(a.date).toLocaleDateString("en-GB"),
			"Employee ID": a.employee?.code,
			"Employee Name": a.employee?.user?.name,
			"Clock In": formatTime(a.clockIn),
			"Clock Out": formatTime(a.clockOut),
			"Late (Mins)": a.lateMinutes,
			"Overtime (Mins)": a.isOvertime ? a.overtimeMinutes : 0,
			Status: a.status,
		}));

		const worksheet = XLSX.utils.json_to_sheet(exportData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Attendances");

		const dateStr = selectedDate.toLocaleDateString("en-GB").replace(/\//g, "-");
		XLSX.writeFile(workbook, `Attendance_Report_${dateStr}.xlsx`);
	};

	if (role === "EMPLOYEE") return <EmployeeAttendance />;

	return (
		<div className="flex flex-col gap-6">
			{/* HEADER (TETAP SAMA) */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 transition-colors">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Attendance</h1>
				<p className="text-gray-500 dark:text-gray-400 text-sm">Select a date from the calendar to view attendance</p>
			</div>

			<div className="flex flex-col lg:flex-row gap-6">
				{/* BAGIAN KIRI: KALENDER WIDGET (TETAP SAMA) */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 lg:w-1/3 h-fit transition-colors">
					<div className="flex justify-between items-center mb-4">
						<button
							onClick={handlePrevMonth}
							className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg font-bold transition">
							&lt;
						</button>
						<h2 className="text-lg font-bold text-gray-800 dark:text-white">
							{monthNames[currentMonth]} {currentYear}
						</h2>
						<button
							onClick={handleNextMonth}
							className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg font-bold transition">
							&gt;
						</button>
					</div>
					<div className="grid grid-cols-7 gap-1 mb-2">
						{dayNames.map((d) => (
							<div
								key={d}
								className="text-center text-xs font-bold text-gray-400 py-1">
								{d}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: startDayOfWeek }).map((_, i) => (
							<div
								key={`empty-${i}`}
								className="p-2"></div>
						))}
						{Array.from({ length: daysInMonth }).map((_, i) => {
							const day = i + 1;
							const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
							const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
							return (
								<button
									key={day}
									onClick={() => handleDateClick(day)}
									className={`p-2 rounded-lg text-sm font-semibold transition flex justify-center items-center h-10 w-10 mx-auto ${isSelected ? "bg-blue-600 text-white shadow-md" : isToday ? "border border-blue-400 text-blue-600" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
									{day}
								</button>
							);
						})}
					</div>
				</div>

				{/* BAGIAN KANAN: TABEL DATA & PENCARIAN */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 lg:w-2/3 flex flex-col transition-colors">
					{/* 🔥 HEADER TABEL DENGAN TOMBOL EXCEL */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 gap-4">
						<h2 className="text-xl font-bold text-gray-800 dark:text-white">
							Records for: <span className="text-blue-600 dark:text-blue-400">{selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
						</h2>

						<div className="flex gap-3 w-full sm:w-auto">
							<input
								type="text"
								placeholder="Search employee..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[250px] text-sm transition-colors"
							/>
							<button
								onClick={handleExportExcel}
								className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition text-sm flex items-center justify-center gap-2 whitespace-nowrap">
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
								Export
							</button>
						</div>
					</div>

					{/* TABLE (TETAP SAMA) */}
					{loading ? (
						<div className="flex-grow flex items-center justify-center text-gray-500 py-10">Loading records...</div>
					) : (
						<>
							<div className="overflow-x-auto w-full flex-grow rounded-lg border border-gray-200 dark:border-gray-700">
								<table className="w-full text-sm text-left whitespace-nowrap">
									<thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs border-b border-gray-200 dark:border-gray-700">
										<tr>
											<th className="p-3 border-b border-gray-200 dark:border-gray-700">Employee</th>
											<th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">Clock In</th>
											<th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">Clock Out</th>
											<th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">Late/OT</th>
											<th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">Status</th>
											<th className="p-3 border-b border-gray-200 dark:border-gray-700 text-center">Action</th>
										</tr>
									</thead>
									<tbody>
										{filteredAttendances.length === 0 ? (
											<tr>
												<td
													colSpan={6}
													className="p-10 text-center text-gray-500">
													No attendance records found.
												</td>
											</tr>
										) : (
											filteredAttendances.map((a) => (
												<tr
													key={a.id}
													className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
													<td className="p-3">
														<div className="font-semibold text-gray-800 dark:text-gray-200">{a.employee?.user?.name || "Unknown"}</div>
														<div className="text-xs text-gray-500">{a.employee?.code}</div>
													</td>
													<td className="p-3 text-center font-mono">{formatTime(a.clockIn)}</td>
													<td className="p-3 text-center font-mono">{formatTime(a.clockOut)}</td>
													<td className="p-3 text-center">
														{a.lateMinutes > 0 && <span className="text-red-600 font-bold block text-xs">Late: {a.lateMinutes}m</span>}
														{a.isOvertime && a.overtimeMinutes > 0 && <span className="text-green-600 font-bold block text-xs">OT: {a.overtimeMinutes}m</span>}
														{a.lateMinutes === 0 && !a.isOvertime && <span className="text-gray-400">-</span>}
													</td>
													<td className="p-3 text-center">
														{a.status === "PRESENT" && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PRESENT</span>}
														{a.status === "LATE" && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">LATE</span>}
														{a.status === "ABSENT" && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">ABSENT</span>}
														{a.status === "LEAVE" && <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">ON LEAVE</span>}
													</td>
													<td className="p-3 text-center">
														<button
															onClick={() => alert("Fitur edit manual menyusul!")}
															className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-semibold px-3 py-1 rounded shadow-sm text-xs transition">
															Edit
														</button>
														{(a.clockInPhoto || a.clockOutPhoto) && (
															<button
																onClick={() => setSelectedPhoto(a.clockInPhoto || a.clockOutPhoto)}
																className="bg-purple-100 text-purple-600 hover:bg-purple-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition ml-1">
																📸 View
															</button>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

							{/* Pagination (TETAP SAMA) */}
							{pagination && pagination.total_pages > 1 && (
								<div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
									<div>
										Showing page <span className="font-bold">{pagination.page}</span> of <span className="font-bold">{pagination.total_pages}</span>
									</div>
									<div className="flex gap-2">
										<button
											disabled={pagination.page <= 1}
											onClick={() => setPage((p) => p - 1)}
											className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
											Prev
										</button>
										<button
											disabled={pagination.page >= pagination.total_pages}
											onClick={() => setPage((p) => p + 1)}
											className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
											Next
										</button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* MODAL FOTO (TETAP SAMA) */}
			{selectedPhoto && (
				<div
					className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
					onClick={() => setSelectedPhoto(null)}>
					<div
						className="relative bg-white rounded-3xl p-2 max-w-lg w-full scale-in"
						onClick={(e) => e.stopPropagation()}>
						<button
							onClick={() => setSelectedPhoto(null)}
							className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg font-bold flex items-center justify-center hover:bg-red-600 transition z-10">
							✕
						</button>
						<img
							src={getImageUrl(selectedPhoto)!}
							alt="Evidence"
							className="w-full h-auto rounded-2xl"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
