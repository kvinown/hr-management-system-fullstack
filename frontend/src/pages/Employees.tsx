import DynamicCrud, { type CrudConfig } from "../components/DynamicCrud";

const employeeConfig: CrudConfig = {
	title: "Employees",
	apiUrl: "/employees",
	displayColumns: [
		{ key: "code", label: "NIK / Code" },
		{ key: "user.name", label: "Name" }, // Mengambil dari tabel relasi User
		{ key: "user.email", label: "Email" }, // Mengambil dari tabel relasi User
		{ key: "department.name", label: "Department" },
		{ key: "position.name", label: "Position" },
		{ key: "shift.name", label: "Shift" },
	],
	fields: [
		{
			name: "name",
			label: "Employee Name",
			type: "text",
			required: true,
		},
		{
			name: "email",
			label: "Email Address",
			type: "text",
			required: true,
		},
		{
			name: "password",
			label: "Password (For Login)",
			type: "text",
			required: true,
		},
		{
			name: "salary",
			label: "Basic Salary (Rp)",
			type: "number",
			required: true,
		},
		{
			name: "departmentId",
			label: "Department",
			type: "select",
			required: true,
			optionsApiUrl: "/departments",
			optionLabelKey: "name",
			optionValueKey: "id",
		},
		{
			name: "positionId",
			label: "Position",
			type: "select",
			required: true,
			optionsApiUrl: "/positions",
			optionLabelKey: "name",
			optionValueKey: "id",
		},
		{
			name: "shiftId",
			label: "Shift",
			type: "select",
			required: true,
			optionsApiUrl: "/shifts",
			optionLabelKey: "name",
			optionValueKey: "id",
		},
	],
};

export default function Employees() {
	return <DynamicCrud config={employeeConfig} />;
}
