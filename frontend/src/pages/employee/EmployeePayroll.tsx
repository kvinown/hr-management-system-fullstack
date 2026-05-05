import { useState, useEffect } from "react";
import api from "../../lib/axios";

export default function EmployeePayroll() {
	const [payrolls, setPayrolls] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get("/payrolls?limit=50")
			.then((res) => setPayrolls(res.data.data || []))
			.finally(() => setLoading(false));
	}, []);

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
	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	if (loading) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading your payslips...</div>;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Payslips</h1>
				<p className="text-gray-500 dark:text-gray-400 text-sm">View and download your monthly salary records</p>
			</div>

			{payrolls.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-sm text-center text-gray-500 dark:text-gray-400">You don't have any payslips yet.</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{payrolls.map((p) => (
						<div
							key={p.id}
							className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
							{/* Card Header */}
							<div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
								<div className="flex items-center gap-3">
									<div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
										<svg
											className="w-6 h-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<div>
										<h3 className="font-bold text-gray-800 dark:text-gray-200">
											{monthNames[p.month - 1]} {p.year}
										</h3>
										<div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
											<span className="text-green-600 dark:text-green-400">{p.totalAttendance}H</span> &bull; <span className="text-yellow-600 dark:text-yellow-400">{p.totalLate}T</span> &bull;{" "}
											<span className="text-red-600 dark:text-red-400">{p.totalAbsent}A</span>
										</div>
									</div>
								</div>
								<button
									onClick={() => handleDownloadPdf(p.id, p.employee?.user?.name, p.month, p.year)}
									className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center gap-2">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									PDF
								</button>
							</div>

							{/* Card Body */}
							<div className="p-5 space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-gray-500 dark:text-gray-400">Base Salary</span>
									<span className="font-semibold text-gray-800 dark:text-gray-200">{formatRp(p.baseSalary)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-500 dark:text-gray-400">Overtime (+)</span>
									<span className="font-semibold text-green-600 dark:text-green-400">+{formatRp(p.overtimePay)}</span>
								</div>
								<div className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-3">
									<span className="text-gray-500 dark:text-gray-400">Deductions (-)</span>
									<span className="font-semibold text-red-600 dark:text-red-400">-{formatRp(p.deductions)}</span>
								</div>
								<div className="flex justify-between items-center pt-2">
									<span className="font-bold text-gray-800 dark:text-gray-200">Take Home Pay</span>
									<span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatRp(p.totalSalary)}</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
