import DynamicCrud, { type CrudConfig } from "../components/DynamicCrud";

const shiftConfig: CrudConfig = {
	title: "Shifts",
	apiUrl: "/shifts",
	displayColumns: [
		{ key: "code", label: "Shift Code" },
		{ key: "name", label: "Shift Name" },
		{ key: "startTime", label: "Start Time" },
		{ key: "endTime", label: "End Time" },
		{ key: "lateTolerance", label: "Late Tolerance (mins)" },
	],
	fields: [
		{ name: "name", label: "Shift Name", type: "text", required: true },
		{ name: "startTime", label: "Start Time", type: "time", required: true },
		{ name: "endTime", label: "End Time", type: "time", required: true },
		{ name: "lateTolerance", label: "Late Tolerance (minutes)", type: "number", required: true },
	],
};

export default function Shifts() {
	return <DynamicCrud config={shiftConfig} />;
}
