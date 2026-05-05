import { useState, useEffect } from "react";
import api from "../../lib/axios";

export default function EmployeeLeave() {
	const [leaves, setLeaves] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [submitLoading, setSubmitLoading] = useState(false);

	// Form State
	const [form, setForm] = useState({
		type: "ANNUAL",
		startDate: "",
		endDate: "",
		reason: "",
	});

	const fetchLeaves = async () => {
		setLoading(true);
		try {
			const res = await api.get("/leaves?limit=50");
			setLeaves(res.data.data || []);
		} catch (err: any) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaves();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitLoading(true);
		try {
			await api.post("/leaves", form);
			alert("✅ Leave request submitted successfully!");
			setIsModalOpen(false);
			setForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" }); // Reset form
			fetchLeaves(); // Refresh data
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setSubmitLoading(false);
		}
	};

	const getStatusBadge = (status: string) => {
		if (status === "APPROVED") return <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800">APPROVED</span>;
		if (status === "REJECTED") return <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-200 dark:border-red-800">REJECTED</span>;
		return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-800">PENDING</span>;
	};

	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Leaves</h1>
					<p className="text-gray-500 dark:text-gray-400 text-sm">Manage your time off and sick leaves.</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition">
					+ Request Leave
				</button>
			</div>

			{/* DAFTAR CUTI (CARDS) */}
			{loading ? (
				<div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading your leave history...</div>
			) : leaves.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-sm text-center text-gray-500 dark:text-gray-400">You haven't requested any leaves yet.</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{leaves.map((leave) => (
						<div
							key={leave.id}
							className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex flex-col h-full">
							<div className="flex justify-between items-start mb-4">
								<div>
									<span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 block">{leave.code}</span>
									<h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{leave.type}</h3>
								</div>
								{getStatusBadge(leave.status)}
							</div>

							<div className="flex-grow space-y-3 text-sm">
								<div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
									<svg
										className="w-4 h-4"
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
									<span>
										{new Date(leave.startDate).toLocaleDateString("en-GB")} - {new Date(leave.endDate).toLocaleDateString("en-GB")}
									</span>
								</div>
								<div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 italic">"{leave.reason}"</div>
							</div>

							{leave.approvedBy && (
								<div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
									{leave.status === "APPROVED" ? "Approved by" : "Rejected by"}: <span className="font-semibold text-gray-700 dark:text-gray-300">{leave.approvedBy}</span>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* MODAL PENGAJUAN CUTI */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
					<div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in">
						<h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Request Leave</h2>
						<form
							onSubmit={handleSubmit}
							className="space-y-4">
							<div>
								<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">Leave Type *</label>
								<select
									required
									value={form.type}
									onChange={(e) => setForm({ ...form, type: e.target.value })}
									className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="ANNUAL">Annual Leave (Cuti Tahunan)</option>
									<option value="SICK">Sick Leave (Sakit)</option>
									<option value="UNPAID">Unpaid Leave (Izin di luar tanggungan)</option>
									<option value="MATERNITY">Maternity Leave (Cuti Melahirkan)</option>
								</select>
							</div>
							<div className="flex gap-4">
								<div className="w-1/2">
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">Start Date *</label>
									<input
										type="date"
										required
										value={form.startDate}
										onChange={(e) => setForm({ ...form, startDate: e.target.value })}
										className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div className="w-1/2">
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">End Date *</label>
									<input
										type="date"
										required
										value={form.endDate}
										onChange={(e) => setForm({ ...form, endDate: e.target.value })}
										className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
							<div>
								<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">Reason *</label>
								<textarea
									required
									rows={3}
									placeholder="Please explain why you need this leave..."
									value={form.reason}
									onChange={(e) => setForm({ ...form, reason: e.target.value })}
									className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
							</div>
							<div className="flex justify-end gap-3 mt-6 pt-4">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition">
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitLoading}
									className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50">
									{submitLoading ? "Submitting..." : "Submit Request"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
