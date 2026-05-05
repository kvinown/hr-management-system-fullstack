import { useState, useEffect, useCallback } from "react";
import api from "../../lib/axios";

export default function EmployeeAttendance() {
	const [attendances, setAttendances] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	// State Kalender (Bulan & Tahun saat ini)
	const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
	const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

	// State untuk Kartu Detail di Mobile
	const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(new Date());
	const [selectedAttendance, setSelectedAttendance] = useState<any>(null);

	const fetchMonthlyAttendance = useCallback(async () => {
		setLoading(true);
		// Ambil data dari tanggal 1 sampai akhir bulan
		const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
		const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

		try {
			const res = await api.get("/attendances", {
				params: {
					startDate: startOfMonth.toISOString(),
					endDate: endOfMonth.toISOString(),
					limit: 100, // Cukup untuk 1 bulan (max 31 hari)
				},
			});
			setAttendances(res.data.data || []);
		} catch (err: any) {
			console.error("Failed to fetch attendances", err);
		} finally {
			setLoading(false);
		}
	}, [currentMonth, currentYear]);

	useEffect(() => {
		fetchMonthlyAttendance();
	}, [fetchMonthlyAttendance]);

	// Update detail card setiap kali attendances atau selectedDate berubah
	useEffect(() => {
		if (selectedDateObj) {
			const record = attendances.find((a) => {
				const aDate = new Date(a.date);
				return aDate.getDate() === selectedDateObj.getDate() && aDate.getMonth() === selectedDateObj.getMonth() && aDate.getFullYear() === selectedDateObj.getFullYear();
			});
			setSelectedAttendance(record || null);
		}
	}, [selectedDateObj, attendances]);

	// ==========================================
	// LOGIKA KALENDER
	// ==========================================
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Minggu

	const handlePrevMonth = () => {
		if (currentMonth === 0) {
			setCurrentMonth(11);
			setCurrentYear((prev) => prev - 1);
		} else {
			setCurrentMonth((prev) => prev - 1);
		}
	};
	const handleNextMonth = () => {
		if (currentMonth === 11) {
			setCurrentMonth(0);
			setCurrentYear((prev) => prev + 1);
		} else {
			setCurrentMonth((prev) => prev + 1);
		}
	};

	const handleDateClick = (day: number) => {
		setSelectedDateObj(new Date(currentYear, currentMonth, day));
	};

	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const formatTime = (dateString: string | null) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
	};

	// Helper untuk mendapatkan warna status
	const getStatusColors = (status: string) => {
		if (status === "PRESENT") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800";
		if (status === "LATE") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
		if (status === "ABSENT") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800";
		// 🔥 TAMBAHKAN INI (Warna Ungu/Nila untuk Cuti/Sakit)
		if (status === "LEAVE") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";

		return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
	};

	const getDotColor = (status: string) => {
		if (status === "PRESENT") return "bg-green-500";
		if (status === "LATE") return "bg-yellow-500";
		if (status === "ABSENT") return "bg-red-500";
		if (status === "LEAVE") return "bg-indigo-500"; // 🔥 TAMBAHKAN INI
		return "bg-transparent";
	};

	return (
		<div className="flex flex-col gap-6">
			{/* HEADER */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 transition-colors">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Attendance</h1>
				<p className="text-gray-500 dark:text-gray-400 text-sm">Monitor your daily presence, late minutes, and overtimes.</p>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
				{/* KONTROL BULAN */}
				<div className="p-4 md:p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
					<button
						onClick={handlePrevMonth}
						className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold transition">
						&lt; Prev
					</button>
					<h2 className="text-xl font-bold text-gray-800 dark:text-white">
						{monthNames[currentMonth]} {currentYear}
					</h2>
					<button
						onClick={handleNextMonth}
						className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold transition">
						Next &gt;
					</button>
				</div>

				{/* HEADER HARI */}
				<div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
					{dayNames.map((d, i) => (
						<div
							key={d}
							className={`text-center py-3 text-xs md:text-sm font-bold uppercase tracking-wider ${i === 0 || i === 6 ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
							{d}
						</div>
					))}
				</div>

				{loading ? (
					<div className="p-20 text-center text-gray-500 dark:text-gray-400">Loading calendar data...</div>
				) : (
					/* GRID KALENDER (Garis antar kotak menggunakan gap-px dan background pembungkus) */
					<div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
						{/* KOTAK KOSONG (Hari sebelum tanggal 1) */}
						{Array.from({ length: startDayOfWeek }).map((_, i) => (
							<div
								key={`empty-${i}`}
								className="bg-white dark:bg-gray-800 min-h-[80px] lg:min-h-[120px]"></div>
						))}

						{/* TANGGAL 1 - AKHIR BULAN */}
						{Array.from({ length: daysInMonth }).map((_, i) => {
							const day = i + 1;
							const currentDate = new Date(currentYear, currentMonth, day);
							const dayOfWeek = currentDate.getDay();
							const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
							const isToday = new Date().toDateString() === currentDate.toDateString();
							const isSelected = selectedDateObj?.toDateString() === currentDate.toDateString();

							// Cari data absensi di tanggal ini
							const record = attendances.find((a) => {
								const aDate = new Date(a.date);
								return aDate.getDate() === day && aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear;
							});

							return (
								<div
									key={day}
									onClick={() => handleDateClick(day)}
									className={`relative p-1 md:p-2 min-h-[80px] lg:min-h-[120px] transition-colors cursor-pointer group
										${isWeekend ? "bg-gray-50 dark:bg-gray-800/80" : "bg-white dark:bg-gray-800"}
										${isSelected ? "ring-2 ring-inset ring-blue-500" : "hover:bg-gray-100 dark:hover:bg-gray-700/50"}
									`}>
									{/* Teks Tanggal */}
									<div className="flex justify-between items-start">
										<span
											className={`text-sm md:text-base font-semibold w-7 h-7 flex items-center justify-center rounded-full
											${isToday ? "bg-blue-600 text-white" : isWeekend ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}
										`}>
											{day}
										</span>
									</div>

									{/* ========================================= */}
									{/* 🖥️ TAMPILAN DESKTOP (KOTAK BESAR)         */}
									{/* ========================================= */}
									<div className="hidden lg:flex flex-col gap-1 mt-1">
										{record ? (
											<div className={`text-xs px-2 py-1.5 rounded border ${getStatusColors(record.status)}`}>
												<div className="font-bold">{record.status}</div>
												{record.status !== "ABSENT" && (
													<div className="mt-0.5 opacity-80">
														{formatTime(record.clockIn)} - {formatTime(record.clockOut)}
													</div>
												)}
											</div>
										) : (
											<div className="text-xs px-2 py-1.5 text-gray-400 dark:text-gray-500 font-medium italic">{isWeekend ? "Weekend" : "No Data"}</div>
										)}
									</div>

									{/* ========================================= */}
									{/* 📱 TAMPILAN MOBILE (TITIK WARNA)          */}
									{/* ========================================= */}
									<div className="flex lg:hidden justify-center mt-2">{record && <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(record.status)}`}></div>}</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* ========================================= */}
			{/* 📱 KARTU DETAIL (Muncul saat tanggal diklik) */}
			{/* ========================================= */}
			{selectedDateObj && (
				<div className="lg:hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 transition-colors animate-fade-in">
					<h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Detail: {selectedDateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</h3>

					{selectedAttendance ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-500 dark:text-gray-400">Status</span>
								<span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColors(selectedAttendance.status)}`}>{selectedAttendance.status}</span>
							</div>

							{selectedAttendance.status !== "ABSENT" && (
								<>
									<div className="flex items-center justify-between">
										<span className="text-gray-500 dark:text-gray-400">Clock In</span>
										<span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatTime(selectedAttendance.clockIn)}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-500 dark:text-gray-400">Clock Out</span>
										<span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatTime(selectedAttendance.clockOut)}</span>
									</div>
								</>
							)}

							{(selectedAttendance.lateMinutes > 0 || selectedAttendance.overtimeMinutes > 0) && (
								<div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
									{selectedAttendance.lateMinutes > 0 && (
										<div>
											<span className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Late Penalty</span>
											<span className="text-red-600 dark:text-red-400 font-bold">{selectedAttendance.lateMinutes} mins</span>
										</div>
									)}
									{selectedAttendance.overtimeMinutes > 0 && (
										<div className="text-right">
											<span className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Overtime Bonus</span>
											<span className="text-green-600 dark:text-green-400 font-bold">{selectedAttendance.overtimeMinutes} mins</span>
										</div>
									)}
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-6 text-gray-400 dark:text-gray-500 italic">{selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6 ? "Enjoy your weekend! 🌴" : "No attendance recorded for this date."}</div>
					)}
				</div>
			)}
		</div>
	);
}
