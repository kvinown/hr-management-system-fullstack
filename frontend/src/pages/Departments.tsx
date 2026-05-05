import DynamicCrud, { type CrudConfig } from "../components/DynamicCrud";

const departmentConfig: CrudConfig = {
	title: "Departments",
	apiUrl: "/departments",
	displayColumns: [
		{ key: "code", label: "Department Code" },
		{ key: "name", label: "Department Name" },
	],
	fields: [
		{
			name: "name",
			label: "Department Name",
			type: "text",
			required: true,
		},
	],
};

export default function Departments() {
	return <DynamicCrud config={departmentConfig} />;
}
