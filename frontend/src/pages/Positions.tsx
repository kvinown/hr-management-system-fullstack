import DynamicCrud, { type CrudConfig } from "../components/DynamicCrud";

const positionConfig: CrudConfig = {
	title: "Positions",
	apiUrl: "/positions",
	displayColumns: [
		{ key: "code", label: "Position Code" },
		{ key: "name", label: "Position Name" },
	],
	fields: [{ name: "name", label: "Position Name", type: "text", required: true }],
};

export default function Positions() {
	return <DynamicCrud config={positionConfig} />;
}
