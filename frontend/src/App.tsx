import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Departments from "./pages/Departments";
import Employees from "./pages/Employees";
import Shifts from "./pages/Shifts";
import Positions from "./pages/Positions";
import Attendances from "./pages/Attendances";
import Payrolls from "./pages/Payrolls";
import Leaves from "./pages/Leaves";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* LOGIN */}
				<Route
					path="/login"
					element={<Login />}
				/>

				{/* PROTECTED */}
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Dashboard />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				{/* 🔥 Tambahkan Route Department */}
				<Route
					path="/departments"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Departments />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/positions"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Positions />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/shifts"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Shifts />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/employees"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Employees />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/attendances"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Attendances />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/payrolls"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Payrolls />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/leaves"
					element={
						<ProtectedRoute>
							<MainLayout>
								<Leaves />
							</MainLayout>
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
