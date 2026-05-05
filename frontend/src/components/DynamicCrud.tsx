import { useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/axios";
import DynamicTable from "./DynamicTable";

export type FieldType = "text" | "number" | "time" | "select" | "date" | "datetime-local";

export interface FieldSchema {
	name: string;
	label: string;
	type: FieldType;
	required?: boolean;
	optionsApiUrl?: string; // Untuk dinamis dari backend
	optionLabelKey?: string;
	optionValueKey?: string;
	options?: { label: string; value: string | number }[]; // 🔥 Tambahan untuk opsi statis
}

export interface CrudConfig {
	title: string;
	apiUrl: string;
	primaryKey?: string;
	displayColumns: { key: string; label: string; type?: "date" | "badge" }[];
	fields: FieldSchema[];
	disableAdd?: boolean;
	disableEdit?: boolean;
	disableStatus?: boolean;
	hasDownloadPdf?: boolean;
}

interface DynamicCrudProps {
	config: CrudConfig;
}

const getNestedValue = (obj: any, path: string) => {
	if (!path) return "";
	return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export default function DynamicCrud({ config }: DynamicCrudProps) {
	const [data, setData] = useState<any[]>([]);
	const [pagination, setPagination] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [viewMode, setViewMode] = useState<"active" | "inactive">("active");

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [selectOptions, setSelectOptions] = useState<Record<string, any[]>>({});

	const firstInputRef = useRef<any>(null);
	const pk = config.primaryKey || "id";

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get(`${config.apiUrl}?page=${page}&limit=${limit}&viewMode=${viewMode}`);
			setData(res.data.data);
			setPagination(res.data.pagination);
		} catch (err) {
			console.error(`Failed to fetch ${config.title}`, err);
		} finally {
			setLoading(false);
		}
	}, [config.apiUrl, page, limit, viewMode]);

	const fetchSelectOptions = useCallback(async () => {
		const selectFields = config.fields.filter((f) => f.type === "select" && f.optionsApiUrl);
		const newOptions: Record<string, any[]> = {};
		for (const field of selectFields) {
			try {
				const res = await api.get(`${field.optionsApiUrl}?limit=100&viewMode=active`);
				newOptions[field.name] = res.data.data || res.data;
			} catch (err) {
				console.error(`Failed to fetch options`, err);
			}
		}
		setSelectOptions(newOptions);
	}, [config.fields]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		fetchSelectOptions();
	}, [fetchSelectOptions]);

	useEffect(() => {
		if (isModalOpen && firstInputRef.current) {
			setTimeout(() => {
				firstInputRef.current?.focus();
			}, 10);
		}
	}, [isModalOpen]);

	const handleAdd = () => {
		setFormData({});
		setEditingId(null);
		setIsModalOpen(true);
	};

	const handleEdit = (item: any) => {
		// Jika ada field date/datetime-local, format value dari API (YYYY-MM-DD) agar bisa masuk ke <input type="date">
		const initialForm = { ...item };
		config.fields.forEach((field) => {
			if (field.type === "date" && initialForm[field.name]) {
				initialForm[field.name] = new Date(initialForm[field.name]).toISOString().split("T")[0];
			}
		});

		setFormData(initialForm);
		setEditingId(item[pk]);
		setIsModalOpen(true);
	};

	const handleChangeStatus = async (item: any) => {
		const isCurrentlyActive = viewMode === "active";
		const actionWord = isCurrentlyActive ? "archive" : "restore";

		if (!window.confirm(`Are you sure you want to ${actionWord} this ${config.title}?`)) return;

		const payload = item.hasOwnProperty("status") ? { status: isCurrentlyActive ? "RESIGNED" : "ACTIVE" } : { isActive: !isCurrentlyActive };

		try {
			await api.patch(`${config.apiUrl}/${item[pk]}/status`, payload);
			fetchData();
		} catch (err: any) {
			alert(err.response?.data?.error || `Failed to ${actionWord}`);
		}
	};

	const handleDownloadPdf = async (item: any) => {
		try {
			const res = await api.get(`${config.apiUrl}/${item[pk]}/payslip`, {
				responseType: "blob",
			});

			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `${config.title}-Document-${item[pk]}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
		} catch (err: any) {
			alert("Failed to download PDF document.");
		}
	};

	const handleChange = (name: string, value: any, type: FieldType) => {
		const finalValue = type === "number" ? Number(value) : value;
		setFormData((prev) => ({ ...prev, [name]: finalValue }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editingId) {
				await api.put(`${config.apiUrl}/${editingId}`, formData);
			} else {
				if (config.apiUrl === "/payrolls") {
					await api.post(`${config.apiUrl}/generate`, formData);
				} else {
					await api.post(config.apiUrl, formData);
				}
			}
			setIsModalOpen(false);
			fetchData();
		} catch (err: any) {
			alert(err.response?.data?.error || "An error occurred");
		}
	};

	const renderInput = (field: FieldSchema, index: number) => {
		const value = formData[field.name] || "";
		const isFirst = index === 0;
		const inputClasses = "w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

		if (field.type === "select") {
			// 🔥 Ambil dari opsi statis JIKA ADA, jika tidak ambil dari API
			const options = field.options || selectOptions[field.name] || [];
			const labelKey = field.options ? "label" : field.optionLabelKey || "name";
			const valueKey = field.options ? "value" : field.optionValueKey || "id";

			return (
				<select
					ref={isFirst ? firstInputRef : null}
					required={field.required}
					value={value}
					onChange={(e) => handleChange(field.name, e.target.value, field.type)}
					className={inputClasses}>
					<option
						value=""
						disabled>
						Select {field.label}
					</option>
					{options.map((opt) => (
						<option
							key={opt[valueKey]}
							value={opt[valueKey]}>
							{getNestedValue(opt, labelKey)}
						</option>
					))}
				</select>
			);
		}

		return (
			<input
				ref={isFirst ? firstInputRef : null}
				type={field.type}
				required={field.required}
				value={value}
				onChange={(e) => handleChange(field.name, e.target.value, field.type)}
				className={inputClasses}
			/>
		);
	};

	return (
		<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-transparent dark:border-gray-700 transition-colors">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">{config.title}</h1>
				{!config.disableAdd && (
					<button
						onClick={handleAdd}
						className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition">
						+ Add {config.title}
					</button>
				)}
			</div>

			{loading ? (
				<div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading data...</div>
			) : (
				<DynamicTable
					columns={config.displayColumns}
					data={data}
					pk={pk}
					viewMode={viewMode}
					pagination={pagination}
					onViewModeChange={(mode) => {
						setViewMode(mode);
						setPage(1);
					}}
					onPageChange={setPage}
					onEdit={!config.disableEdit ? handleEdit : undefined}
					onChangeStatus={!config.disableStatus ? handleChangeStatus : undefined}
					onDownloadPdf={config.hasDownloadPdf ? handleDownloadPdf : undefined}
				/>
			)}

			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
					<div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in">
						<h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
							{editingId ? "Edit" : "Add"} {config.title}
						</h2>
						<form
							onSubmit={handleSubmit}
							className="space-y-4">
							{config.fields.map((field, index) => (
								<div key={field.name}>
									<label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">
										{field.label} {field.required && <span className="text-red-500">*</span>}
									</label>
									{renderInput(field, index)}
								</div>
							))}
							<div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition">
									Cancel
								</button>
								<button
									type="submit"
									className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition">
									Save Changes
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
