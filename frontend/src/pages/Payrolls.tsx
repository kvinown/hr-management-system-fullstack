import { useState, useEffect } from "react";
import api from "../lib/axios";
import { jwtDecode } from "jwt-decode";
import EmployeePayroll from "./employee/EmployeePayroll"; // 🔥 Import komponen Employee

export default function Payrolls() {
	// 🔥 Ambil Role
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

	const [payrolls, setPayrolls] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [generateLoading, setGenerateLoading] = useState(false);

	const currentMonth = new Date().getMonth() + 1;
	const currentYear = new Date().getFullYear();

	const [form, setForm] = useState({ month: currentMonth, year: currentYear });
	const [filterMonth, setFilterMonth] = useState(currentMonth);
	const [filterYear, setFilterYear] = useState(currentYear);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchPayrolls = async () => {
		setLoading(true);
		try {
			const res = await api.get("/payrolls?limit=200");
			setPayrolls(res.data.data || []);
		} catch (err: any) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPayrolls();
	}, []);

	const handleGenerateBulk = async (e: React.FormEvent) => {
		e.preventDefault();
		setGenerateLoading(true);
		try {
			const res = await api.post("/payrolls/generate-bulk", { month: Number(form.month), year: Number(form.year) });
			alert(`✅ ${res.data.message}`);
			setIsModalOpen(false);
			setFilterMonth(Number(form.month));
			setFilterYear(Number(form.year));
			fetchPayrolls();
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setGenerateLoading(false);
		}
	};

	const handleDownloadPdf = async (id: string, name: string, month: number, year: number) => {
		try {
			const res = await api.get(`/payrolls/${id}/payslip`, { responseType: "blob" });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `Payslip-${name.replace(/\s/g, "-")}-${month}-${year}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
		} catch (err: any) {
			alert("Failed to download PDF.");
		}
	};

	const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	const filteredPayrolls = payrolls.filter((p) => {
		const matchPeriod = p.month === filterMonth && p.year === filterYear;
		const matchSearch = p.employee?.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
		return matchPeriod && matchSearch;
	});

	// 🔥 JIKA YANG LOGIN ADALAH EMPLOYEE, LANGSUNG ARAHKAN KE KOMPONEN BARU
	if (role === "EMPLOYEE") return <EmployeePayroll />;

	// ==========================================
	// 🔥 TAMPILAN KHUSUS HR ADMIN (DARI SINI KE BAWAH)
	// ==========================================
	return (
		<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 transition-colors">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payroll Management</h1>
					<p className="text-gray-500 dark:text-gray-400 text-sm">Calculate and manage employee salaries</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow transition">
					+ Bulk Generate Payroll
				</button>
			</div>

			{/* FILTER BAR */}
			<div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
				<div className="flex flex-col w-full sm:w-auto">
					<label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Search Employee</label>
					<input
						type="text"
						placeholder="e.g. Budi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:min-w-[200px]"
					/>
				</div>

				<div className="flex gap-4 w-full sm:w-auto">
					<div className="flex flex-col flex-1">
						<label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Period Month</label>
						<select
							value={filterMonth}
							onChange={(e) => setFilterMonth(Number(e.target.value))}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
							{monthNames.map((m, i) => (
								<option
									key={i}
									value={i + 1}>
									{m}
								</option>
							))}
						</select>
					</div>
					<div className="flex flex-col flex-1">
						<label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Period Year</label>
						<input
							type="number"
							value={filterYear}
							onChange={(e) => setFilterYear(Number(e.target.value))}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[100px]"
						/>
					</div>
				</div>
			</div>

			{/* TABLE */}
			{loading ? (
				<div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading payroll data...</div>
			) : (
				<div className="overflow-x-auto w-full rounded-lg border border-gray-200 dark:border-gray-700">
					<table className="w-full text-sm text-left whitespace-nowrap">
						<thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs border-b border-gray-200 dark:border-gray-700">
							<tr>
								<th className="p-3">Period</th>
								<th className="p-3">Employee</th>
								<th
									className="p-3 text-center cursor-default text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
									title="Hadir / Telat / Absen">
									H / T / A ⓘ
								</th>
								<th className="p-3 text-right">Base Salary</th>
								<th className="p-3 text-right text-green-600 dark:text-green-400">Overtime (+)</th>
								<th className="p-3 text-right text-red-600 dark:text-red-400">Deductions (-)</th>
								<th className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">Take Home Pay</th>
								<th className="p-3 text-center">Action</th>
							</tr>
						</thead>
						<tbody>
							{filteredPayrolls.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="p-10 text-center text-gray-500 dark:text-gray-400">
										{searchQuery ? "No matching records found." : `No payroll generated for ${monthNames[filterMonth - 1]} ${filterYear}.`}
									</td>
								</tr>
							) : (
								filteredPayrolls.map((p) => (
									<tr
										key={p.id}
										className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
										<td className="p-3 font-semibold text-gray-600 dark:text-gray-400">
											{monthNames[p.month - 1]} {p.year}
										</td>
										<td className="p-3">
											<div className="font-semibold text-gray-800 dark:text-gray-200">{p.employee?.user?.name || "Unknown"}</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">{p.employee?.department?.name}</div>
										</td>
										<td className="p-3 text-center text-gray-600 dark:text-gray-400">
											<span className="text-green-600 dark:text-green-400 font-bold">{p.totalAttendance}</span> /<span className="text-yellow-600 dark:text-yellow-400 font-bold mx-1">{p.totalLate}</span> /
											<span className="text-red-600 dark:text-red-400 font-bold">{p.totalAbsent}</span>
										</td>
										<td className="p-3 text-right text-gray-800 dark:text-gray-300">{formatRp(p.baseSalary)}</td>
										<td className="p-3 text-right text-green-600 dark:text-green-400">+{formatRp(p.overtimePay)}</td>
										<td className="p-3 text-right text-red-600 dark:text-red-400">-{formatRp(p.deductions)}</td>
										<td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400 text-base">{formatRp(p.totalSalary)}</td>
										<td className="p-3 text-center">
											<button
												onClick={() => handleDownloadPdf(p.id, p.employee?.user?.name, p.month, p.year)}
												className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 font-semibold px-3 py-1 rounded shadow-sm text-xs transition">
												📄 PDF
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* MODAL BULK GENERATE */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
					<div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
						<h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Bulk Generate Payroll</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-6 mt-3">Calculate salary for all active employees who haven't received payroll in this period.</p>
						<form onSubmit={handleGenerateBulk}>
							<div className="flex gap-4 mb-8">
								<div className="w-1/2">
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Month *</label>
									<select
										required
										value={form.month}
										onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
										className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
										{monthNames.map((m, i) => (
											<option
												key={i}
												value={i + 1}>
												{m}
											</option>
										))}
									</select>
								</div>
								<div className="w-1/2">
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Year *</label>
									<input
										type="number"
										required
										value={form.year}
										onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
										className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
							<div className="flex justify-end gap-3 pt-4">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition">
									Cancel
								</button>
								<button
									type="submit"
									disabled={generateLoading}
									className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 min-w-[120px]">
									{generateLoading ? "Processing..." : "Generate All"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
