import React, { useState, useMemo, useEffect } from "react";

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
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

	useEffect(() => {
		const defaultCol = columns.find((c) => c.key.toLowerCase().includes("code")) || columns[0];
		if (defaultCol && !sortConfig) {
			setSortConfig({ key: defaultCol.key, direction: "asc" });
		}
	}, [columns]);

	const getNestedValue = (obj: any, path: string) => {
		if (!path) return "";
		return path.split(".").reduce((acc, part) => acc && acc[part], obj);
	};

	const sortedData = useMemo(() => {
		let sortableItems = [...data];
		if (sortConfig !== null) {
			sortableItems.sort((a, b) => {
				const aVal = getNestedValue(a, sortConfig.key) || "";
				const bVal = getNestedValue(b, sortConfig.key) || "";

				if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
				if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}
		return sortableItems;
	}, [data, sortConfig]);

	const handleSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const handlePageTransition = (newPage: number) => {
		onPageChange(newPage);
	};

	const hasActions = onEdit || onChangeStatus || onDownloadPdf;

	const renderValue = (item: any, col: any) => {
		let val = getNestedValue(item, col.key);

		if (col.type === "date" && val) {
			val = new Date(val).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
		}

		if (col.type === "badge" && val) {
			const badgeColors: any = {
				APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800",
				REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800",
				PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
				ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
			};
			const color = badgeColors[val] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
			return <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${color}`}>{val}</span>;
		}

		return val || "-";
	};

	// Komponen Reusable untuk Pagination Controls
	const renderPaginationControls = (isDesktop: boolean) => {
		if (!pagination || pagination.total_pages <= 0) return null;

		return (
			<div className={`flex items-center gap-4 ${isDesktop ? "text-xs" : "flex-col p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mt-6 text-sm"}`}>
				<div className="font-medium text-gray-600 dark:text-gray-400">
					Page <span className="font-bold text-gray-800 dark:text-white px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md mx-0.5">{pagination.page}</span> of{" "}
					<span className="font-bold text-gray-800 dark:text-white">{pagination.total_pages}</span>
					{!isDesktop && <span className="ml-2 text-xs text-gray-400">({pagination.total_items} items)</span>}
				</div>
				<div className="flex gap-2">
					<button
						disabled={pagination.page <= 1}
						onClick={() => handlePageTransition(pagination.page - 1)}
						className={`border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition text-gray-800 dark:text-gray-200 font-bold bg-white dark:bg-gray-800 shadow-sm ${isDesktop ? "px-3 py-1.5" : "px-6 py-2"}`}>
						{isDesktop ? "Prev" : "Previous"}
					</button>
					<button
						disabled={pagination.page >= pagination.total_pages}
						onClick={() => handlePageTransition(pagination.page + 1)}
						className={`border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition text-gray-800 dark:text-gray-200 font-bold bg-white dark:bg-gray-800 shadow-sm ${isDesktop ? "px-3 py-1.5" : "px-6 py-2"}`}>
						Next
					</button>
				</div>
			</div>
		);
	};

	return (
		<div>
			{/* HEADER: TABS & DESKTOP PAGINATION */}
			<div className="flex justify-between items-end mb-4 border-b border-gray-200 dark:border-gray-700">
				<div className="flex gap-6 px-2">
					<button
						onClick={() => onViewModeChange("active")}
						className={`font-bold pb-3 px-1 border-b-2 transition-all translate-y-[1px] ${
							viewMode === "active" ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400" : "text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300"
						}`}>
						Active Data
					</button>
					<button
						onClick={() => onViewModeChange("inactive")}
						className={`font-bold pb-3 px-1 border-b-2 transition-all translate-y-[1px] ${
							viewMode === "inactive" ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400" : "text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300"
						}`}>
						Inactive / Archived
					</button>
				</div>

				{/* 🔥 TAMPIL HANYA DI DESKTOP (Kanan Atas) */}
				<div className="hidden md:block pb-2 pr-2">{renderPaginationControls(true)}</div>
			</div>

			<div>
				{/* DESKTOP TABLE */}
				<div className="hidden md:block overflow-x-auto w-full rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
					<table className="w-full bg-white dark:bg-gray-800 text-sm whitespace-nowrap">
						<thead>
							<tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
								{columns.map((col) => (
									<th
										key={col.key}
										onClick={() => handleSort(col.key)}
										className="p-4 text-left font-bold tracking-wide uppercase text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition select-none">
										<div className="flex items-center gap-2">
											{col.label}
											<span className="text-gray-400 text-[10px]">{sortConfig?.key === col.key ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}</span>
										</div>
									</th>
								))}
								{hasActions && <th className="p-4 text-center font-bold tracking-wide uppercase text-xs">Actions</th>}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
							{sortedData.length === 0 ? (
								<tr>
									<td
										colSpan={columns.length + (hasActions ? 1 : 0)}
										className="p-10 text-center text-gray-500 italic">
										No data available.
									</td>
								</tr>
							) : (
								sortedData.map((item, idx) => (
									<tr
										key={item[pk] || idx}
										className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
										{columns.map((col) => (
											<td
												key={col.key}
												className="p-4 text-gray-800 dark:text-gray-200">
												{renderValue(item, col)}
											</td>
										))}
										{hasActions && (
											<td className="p-4">
												<div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
													{onEdit && (
														<button
															onClick={() => onEdit(item)}
															className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs transition">
															Edit
														</button>
													)}
													{onChangeStatus && (
														<button
															onClick={() => onChangeStatus(item)}
															className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 font-bold px-3 py-1.5 rounded-lg text-xs transition">
															Status
														</button>
													)}
													{onDownloadPdf && (
														<button
															onClick={() => onDownloadPdf(item)}
															className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg text-xs transition">
															PDF
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

				{/* MOBILE CARDS */}
				<div className="md:hidden flex flex-col gap-4">
					{sortedData.length === 0 ? (
						<div className="p-10 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">No data available.</div>
					) : (
						sortedData.map((item, idx) => (
							<div
								key={item[pk] || idx}
								className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3 relative overflow-hidden">
								<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl"></div>

								{columns.map((col) => (
									<div
										key={col.key}
										className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0 last:pb-0">
										<span className="text-xs font-bold text-gray-400 uppercase">{col.label}</span>
										<span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{renderValue(item, col)}</span>
									</div>
								))}

								{hasActions && (
									<div className="flex gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
										{onEdit && (
											<button
												onClick={() => onEdit(item)}
												className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold py-2 rounded-lg text-xs transition">
												Edit
											</button>
										)}
										{onChangeStatus && (
											<button
												onClick={() => onChangeStatus(item)}
												className="flex-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold py-2 rounded-lg text-xs transition">
												Status
											</button>
										)}
										{onDownloadPdf && (
											<button
												onClick={() => onDownloadPdf(item)}
												className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-2 rounded-lg text-xs transition">
												PDF
											</button>
										)}
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>

			{/* 🔥 TAMPIL HANYA DI MOBILE (Di Bawah List) */}
			<div className="md:hidden">{renderPaginationControls(false)}</div>
		</div>
	);
}
