import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import DynamicCrud, { type CrudConfig } from "../components/DynamicCrud";

export default function Leaves() {
	const [role, setRole] = useState("");

	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				setRole((jwtDecode(token) as any).role);
			} catch (err) {}
		}
	}, []);

	if (!role) return null;

	// ==========================================
	// 🟢 CONFIG UNTUK EMPLOYEE (Hanya Add)
	// ==========================================
	if (role === "EMPLOYEE") {
		const employeeConfig: CrudConfig = {
			title: "My Leaves",
			apiUrl: "/leaves",
			displayColumns: [
				{ key: "code", label: "Ticket" },
				{ key: "type", label: "Type" },
				{ key: "startDate", label: "Start Date", type: "date" },
				{ key: "endDate", label: "End Date", type: "date" },
				{ key: "reason", label: "Reason" },
				{ key: "status", label: "Status", type: "badge" },
				{ key: "approvedBy", label: "Reviewed By" },
			],
			fields: [
				{
					name: "type",
					label: "Leave Type",
					type: "select",
					required: true,
					options: [
						{ label: "Annual Leave (Cuti Tahunan)", value: "ANNUAL" },
						{ label: "Sick Leave (Sakit)", value: "SICK" },
						{ label: "Unpaid Leave (Di luar tanggungan)", value: "UNPAID" },
						{ label: "Maternity Leave (Melahirkan)", value: "MATERNITY" },
					],
				},
				{ name: "startDate", label: "Start Date", type: "date", required: true },
				{ name: "endDate", label: "End Date", type: "date", required: true },
				{ name: "reason", label: "Reason", type: "text", required: true },
			],
			disableEdit: true, // Karyawan tidak boleh edit
			disableStatus: true, // Karyawan tidak boleh arsip
		};

		return <DynamicCrud config={employeeConfig} />;
	}

	// ==========================================
	// 👔 CONFIG UNTUK HR ADMIN (Hanya Edit Status)
	// ==========================================
	const hrConfig: CrudConfig = {
		title: "Leave Approvals",
		apiUrl: "/leaves",
		displayColumns: [
			{ key: "employee.user.name", label: "Employee" },
			{ key: "type", label: "Type" },
			{ key: "startDate", label: "Start Date", type: "date" },
			{ key: "endDate", label: "End Date", type: "date" },
			{ key: "reason", label: "Reason" },
			{ key: "status", label: "Status", type: "badge" },
			{ key: "approvedBy", label: "Reviewed By" },
		],
		fields: [
			{
				name: "status",
				label: "Approval Action",
				type: "select",
				required: true,
				options: [
					// 🔥 TAMBAHKAN BARIS INI AGAR STATUS AWAL BISA TERBACA
					{ label: "⏳ PENDING (Menunggu)", value: "PENDING" },

					{ label: "✅ APPROVE Request", value: "APPROVED" },
					{ label: "❌ REJECT Request", value: "REJECTED" },
				],
			},
		],
		disableAdd: true,
		disableStatus: true,
	};

	return <DynamicCrud config={hrConfig} />;
}
