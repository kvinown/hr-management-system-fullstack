import { useState, useEffect } from "react";
import api from "../../lib/axios";
import { Edit2, Trash2, Plus } from "lucide-react";

export default function PayrollComponents() {
	const [components, setComponents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// State untuk Modal Form
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		type: "EARNING", // Default value
		amount: 0,
		isDefault: true,
	});

	const fetchComponents = async () => {
		setLoading(true);
		try {
			const res = await api.get("/payroll-components");
			setComponents(res.data.data || []);
		} catch (err) {
			console.error("Failed to fetch components");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchComponents();
	}, []);

	// Buka modal untuk Tambah
	const handleOpenAdd = () => {
		setEditingId(null);
		setFormData({ name: "", type: "EARNING", amount: 0, isDefault: true });
		setIsModalOpen(true);
	};

	// Buka modal untuk Edit
	const handleOpenEdit = (c: any) => {
		setEditingId(c.id);
		setFormData({ name: c.name, type: c.type, amount: c.amount, isDefault: c.isDefault });
		setIsModalOpen(true);
	};

	// Fungsi Hapus
	const handleDelete = async (id: string, name: string) => {
		if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
		try {
			await api.delete(`/payroll-components/${id}`);
			fetchComponents();
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		}
	};

	// Fungsi Simpan (Create / Update)
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			if (editingId) {
				await api.put(`/payroll-components/${editingId}`, formData);
			} else {
				await api.post("/payroll-components", formData);
			}
			setIsModalOpen(false);
			fetchComponents();
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setSaving(false);
		}
	};

	const formatRp = (amount: number) => {
		return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
	};

	return (
		<div className="space-y-6 animate-fade-in">
			{/* HEADER */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 transition-colors">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payroll Components</h1>
				<p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage earnings (allowances) and deductions (penalties) for monthly payroll.</p>
			</div>

			{/* GRID CARDS */}
			{loading ? (
				<div className="p-10 text-center text-gray-500">Loading components...</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* CARD UNTUK TAMBAH BARU */}
					<button
						onClick={handleOpenAdd}
						className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all min-h-[160px] group">
						<div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
							<Plus size={24} />
						</div>
						<span className="font-bold text-sm tracking-wide">ADD NEW COMPONENT</span>
					</button>

					{/* LIST KOMPONEN */}
					{components.map((c) => (
						<div
							key={c.id}
							className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all">
							{/* Garis Aksen Kiri */}
							<div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.type === "EARNING" ? "bg-green-500" : "bg-red-500"}`}></div>

							<div className="flex justify-between items-start mb-4">
								<span
									className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
										c.type === "EARNING" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
									}`}>
									{c.type === "EARNING" ? "Earning (+)" : "Deduction (-)"}
								</span>

								{/* Tombol Aksi (Edit & Delete) */}
								<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={() => handleOpenEdit(c)}
										className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
										title="Edit">
										<Edit2 size={16} />
									</button>
									<button
										onClick={() => handleDelete(c.id, c.name)}
										className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
										title="Delete">
										<Trash2 size={16} />
									</button>
								</div>
							</div>

							<h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{c.name}</h4>
							<div className="flex items-end justify-between mt-2">
								<p className={`text-2xl font-mono font-black tracking-tight ${c.type === "EARNING" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatRp(c.amount)}</p>
								<p className="text-[10px] text-gray-400 font-bold uppercase">{c.isDefault ? "Default" : "Custom"}</p>
							</div>
						</div>
					))}
				</div>
			)}

			{/* MODAL FORM ADD/EDIT */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
					<div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md scale-in border border-gray-100 dark:border-gray-700">
						<h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">{editingId ? "Edit Component" : "Add Component"}</h2>

						<form
							onSubmit={handleSubmit}
							className="space-y-5">
							<div>
								<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Component Name</label>
								<input
									type="text"
									required
									placeholder="e.g. Transport Allowance"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Type</label>
									<select
										value={formData.type}
										onChange={(e) => setFormData({ ...formData, type: e.target.value })}
										className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow font-bold">
										<option value="EARNING">Earning (+)</option>
										<option value="DEDUCTION">Deduction (-)</option>
									</select>
								</div>
								<div>
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Amount (Rp)</label>
									<input
										type="number"
										required
										min="0"
										value={formData.amount}
										onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
										className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow font-mono"
									/>
								</div>
							</div>

							<label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-2">
								<input
									type="checkbox"
									checked={formData.isDefault}
									onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
									className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
								/>
								<div>
									<p className="text-sm font-bold text-gray-800 dark:text-white">Apply to all employees</p>
									<p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Set as default component</p>
								</div>
							</label>

							<div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors">
									Cancel
								</button>
								<button
									type="submit"
									disabled={saving}
									className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50">
									{saving ? "Saving..." : "Save Component"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
