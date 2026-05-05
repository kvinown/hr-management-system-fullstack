import React from "react";

interface DynamicTableProps {
	columns: { key: string; label: string; type?: "date" | "badge" }[];
	data: any[];
	pk: string;
	viewMode: "active" | "inactive";
	pagination: any;
	onViewModeChange: (mode: "active" | "inactive") => void;
	onPageChange: (page: number) => void;
	onEdit?: (item: any) => void;
	onChangeStatus?: (item: any) => void;
	onDownloadPdf?: (item: any) => void;
}

export default function DynamicTable({ columns, data, pk, viewMode, pagination, onViewModeChange, onPageChange, onEdit, onChangeStatus, onDownloadPdf }: DynamicTableProps) {
	const getNestedValue = (obj: any, path: string) => {
		if (!path) return "";
		return path.split(".").reduce((acc, part) => acc && acc[part], obj);
	};

	const hasActions = onEdit || onChangeStatus || onDownloadPdf;

	return (
		<div>
			{/* TOGGLE ACTIVE / INACTIVE */}
			<div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
				<button
					onClick={() => onViewModeChange("active")}
					className={`font-semibold px-2 py-1 transition-colors ${
						viewMode === "active" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
					}`}>
					Active Data
				</button>
				<button
					onClick={() => onViewModeChange("inactive")}
					className={`font-semibold px-2 py-1 transition-colors ${
						viewMode === "inactive" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
					}`}>
					Inactive / Archived
				</button>
			</div>

			{/* TABLE CONTAINER */}
			<div className="overflow-x-auto w-full rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
				<table className="w-full bg-white dark:bg-gray-800 text-sm whitespace-nowrap">
					<thead>
						<tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
							{columns.map((col) => (
								<th
									key={col.key}
									className="p-3 text-left font-semibold tracking-wide">
									{col.label}
								</th>
							))}
							{hasActions && <th className="p-3 text-left font-semibold tracking-wide">Actions</th>}
						</tr>
					</thead>
					<tbody>
						{data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length + (hasActions ? 1 : 0)}
									className="p-10 text-center text-gray-500 dark:text-gray-400">
									No data available.
								</td>
							</tr>
						) : (
							data.map((item, idx) => (
								<tr
									key={item[pk] || idx}
									className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
									{columns.map((col) => {
										let val = getNestedValue(item, col.key);

										// 🔥 Format Tanggal Otomatis
										if (col.type === "date" && val) {
											val = new Date(val).toLocaleDateString("en-GB");
										}

										// 🔥 Format Badge Warna Otomatis
										if (col.type === "badge" && val) {
											const badgeColors: any = {
												APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800",
												REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800",
												PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
												ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
											};
											const color = badgeColors[val] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
											val = <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${color}`}>{val}</span>;
										}

										return (
											<td
												key={col.key}
												className="p-3 text-gray-800 dark:text-gray-200">
												{val}
											</td>
										);
									})}
									{hasActions && (
										<td className="p-3">
											<div className="flex gap-2">
												{onEdit && (
													<button
														onClick={() => onEdit(item)}
														className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold px-3 py-1 rounded shadow-sm transition">
														Edit
													</button>
												)}
												{onChangeStatus && (
													<button
														onClick={() => onChangeStatus(item)}
														className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1 rounded shadow-sm transition">
														Status
													</button>
												)}
												{onDownloadPdf && (
													<button
														onClick={() => onDownloadPdf(item)}
														className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded shadow-sm transition">
														📄 PDF
													</button>
												)}
											</div>
										</td>
									)}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* PAGINATION */}
			{pagination && pagination.total_pages > 0 && (
				<div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 text-sm text-gray-600 dark:text-gray-400">
					<div>
						Showing page <span className="font-bold text-gray-800 dark:text-gray-200">{pagination.page}</span> of <span className="font-bold text-gray-800 dark:text-gray-200">{pagination.total_pages}</span> (Total: {pagination.total_items}{" "}
						items)
					</div>
					<div className="flex gap-2">
						<button
							disabled={pagination.page <= 1}
							onClick={() => onPageChange(pagination.page - 1)}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition text-gray-800 dark:text-gray-200 font-medium">
							Prev
						</button>
						<button
							disabled={pagination.page >= pagination.total_pages}
							onClick={() => onPageChange(pagination.page + 1)}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition text-gray-800 dark:text-gray-200 font-medium">
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
