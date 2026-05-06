import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Memulai proses seeding...");

	// 🧹 1. Membersihkan data lama dengan urutan yang benar
	console.log("🧹 Membersihkan data lama...");
	// Hapus tabel yang merujuk ke User/Employee dulu (Child Tables)
	await prisma.refreshToken.deleteMany();
	await prisma.attendance.deleteMany();
	await prisma.leave.deleteMany();
	await prisma.payroll.deleteMany(); // 🔥 TAMBAHKAN BARIS INI

	// Baru hapus tabel induknya
	await prisma.employee.deleteMany();
	await prisma.user.deleteMany();

	// Hapus tabel master lainnya
	await prisma.shift.deleteMany();
	await prisma.position.deleteMany();
	await prisma.department.deleteMany();
	await prisma.setting.deleteMany();
	await prisma.payrollComponent.deleteMany();

	// 🔒 2. Hash default password
	const defaultPassword = await bcrypt.hash("1234567890", 10);

	// 👑 3. Buat Admin & HR
	await prisma.user.upsert({
		where: { email: "super@mail.com" },
		update: {},
		create: { name: "Super Admin", email: "super@mail.com", password: defaultPassword, role: "SUPER_ADMIN" },
	});

	const hrUser = await prisma.user.upsert({
		where: { email: "hr@mail.com" },
		update: {},
		create: { name: "HR Admin", email: "hr@mail.com", password: defaultPassword, role: "HR_ADMIN" },
	});
	console.log("✅ Created Admin & HR");

	// ⚙️ 4. GENERATE SETTINGS (Dynamic Config)
	console.log("⏳ Men-generate Global Settings...");
	await prisma.setting.createMany({
		data: [
			{ key: "OFFICE_LAT", value: "-6.859697", description: "Latitude Titik Kantor (Ngamprah, West Java)" },
			{ key: "OFFICE_LNG", value: "107.527850", description: "Longitude Titik Kantor (Ngamprah, West Java)" },
			{ key: "MAX_GEOFENCE_RADIUS", value: "100", description: "Maksimal jarak absen dari kantor (dalam meter)" },
			{ key: "LATE_PENALTY_PER_MINUTE", value: "5000", description: "Denda keterlambatan per menit (Rupiah)" },
			{ key: "AUTO_CLOCK_OUT_TIME", value: "23:50", description: "Jam sistem melakukan auto clock-out" },
		],
	});
	console.log("✅ Created Global Settings");

	// 💰 5. GENERATE PAYROLL COMPONENTS
	console.log("⏳ Men-generate Payroll Components...");
	await prisma.payrollComponent.createMany({
		data: [
			{ name: "Tunjangan Transport", type: "EARNING", isDefault: true, amount: 500000 },
			{ name: "Tunjangan Makan", type: "EARNING", isDefault: true, amount: 300000 },
			{ name: "BPJS Kesehatan", type: "DEDUCTION", isDefault: true, amount: 150000 },
			{ name: "BPJS Ketenagakerjaan", type: "DEDUCTION", isDefault: true, amount: 100000 },
			{ name: "Denda Keterlambatan", type: "DEDUCTION", isDefault: true, amount: 0 }, // 0 karena dinamis per menit
		],
	});
	console.log("✅ Created Payroll Components");

	// 🏢 6. Generate Master Data (Dept, Position, Shift)
	const deptNames = ["Information Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations", "Research and Development", "Legal", "Customer Support", "Quality Assurance"];
	const createdDepts = [];
	for (let i = 0; i < 10; i++) {
		const dept = await prisma.department.create({
			data: { code: `DEP-${String(i + 1).padStart(4, "0")}`, name: deptNames[i] },
		});
		createdDepts.push(dept);
	}

	const posNames = ["Manager", "Supervisor", "Senior Staff", "Junior Staff", "Intern", "Director", "Team Lead", "Analyst", "Specialist", "Coordinator"];
	const createdPositions = [];
	for (let i = 0; i < 10; i++) {
		const pos = await prisma.position.create({
			data: { code: `POS-${String(i + 1).padStart(4, "0")}`, name: posNames[i] },
		});
		createdPositions.push(pos);
	}

	const shiftMorning = await prisma.shift.create({
		data: { code: "SHIFT-MORNING", name: "Morning", startTime: "09:00", endTime: "17:00", lateTolerance: 15 },
	});
	const shiftAfternoon = await prisma.shift.create({
		data: { code: "SHIFT-AFTERNOON", name: "Afternoon", startTime: "13:00", endTime: "21:00", lateTolerance: 15 },
	});
	const shifts = [shiftMorning, shiftAfternoon];
	console.log("✅ Created Departments, Positions, and Shifts");

	// 👥 7. Generate 10 Employees
	const empNames = ["Budi Santoso", "Siti Aminah", "Andi Pratama", "Rina Marlina", "Kevin Owen", "Felisa Keren", "Oscar Karnalim", "Wenny Franciska", "Pelin", "Bernardus"];
	const createdEmployees = [];

	for (let i = 0; i < 10; i++) {
		const name = empNames[i];
		const email = `${name.toLowerCase().replace(/\s/g, ".")}@mail.com`;

		const user = await prisma.user.create({
			data: { name, email, password: defaultPassword, role: "EMPLOYEE" },
		});

		const code = `EMP-${String(i + 1).padStart(4, "0")}`;
		const employee = await prisma.employee.create({
			data: {
				code,
				userId: user.id,
				salary: Math.floor(Math.random() * 10000000) + 5000000,
				status: "ACTIVE",
				departmentId: createdDepts[i].id,
				positionId: createdPositions[i].id,
				shiftId: shifts[i % 2].id,
			},
		});
		createdEmployees.push({ ...employee, isMorning: i % 2 === 0 });
	}
	console.log("✅ Created 10 Employees");

	// 🏖️ 8. GENERATE LEAVES
	const createdLeaves = [];
	for (let i = 0; i < createdEmployees.length; i++) {
		const emp = createdEmployees[i];

		const sickStart = new Date(2026, 1, 10 + i);
		const sickEnd = new Date(sickStart);
		sickEnd.setDate(sickStart.getDate() + 1);

		const leave1 = await prisma.leave.create({
			data: {
				code: `LV-202602${10 + i}-S${emp.id.substring(0, 4)}`,
				employeeId: emp.id,
				type: "SICK",
				startDate: sickStart,
				endDate: sickEnd,
				reason: "Demam berdarah / Tifus",
				status: "APPROVED",
				approvedBy: hrUser.name,
			},
		});
		createdLeaves.push(leave1);

		const annualStart = new Date(2026, 3, 5 + i);
		const annualEnd = new Date(annualStart);
		annualEnd.setDate(annualStart.getDate() + 2);

		const leave2 = await prisma.leave.create({
			data: {
				code: `LV-2026040${5 + i}-A${emp.id.substring(0, 4)}`,
				employeeId: emp.id,
				type: "ANNUAL",
				startDate: annualStart,
				endDate: annualEnd,
				reason: "Liburan keluarga ke luar kota",
				status: "APPROVED",
				approvedBy: hrUser.name,
			},
		});
		createdLeaves.push(leave2);
	}
	console.log("✅ Created Leave Requests");

	// 📅 9. GENERATE ATTENDANCE (Sampai Hari Ini)
	console.log("⏳ Men-generate simulasi absensi dengan data GPS dan Auto-Flags...");
	const attendanceData: any[] = [];
	const startDate = new Date(2026, 0, 1);
	const endDate = new Date(2026, 4, 31);
	// const endDate = new Date(new Date().setDate(new Date().getDate() - 1));

	// Koordinat Base Kantor (Ngamprah)
	const baseLat = -6.859697;
	const baseLng = 107.52785;

	for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
		const dayOfWeek = d.getDay();
		if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekend

		const currentDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

		for (const emp of createdEmployees) {
			const activeLeave = createdLeaves.find((l) => l.employeeId === emp.id && currentDate.getTime() >= l.startDate.getTime() && currentDate.getTime() <= l.endDate.getTime());

			if (activeLeave) {
				attendanceData.push({
					employeeId: emp.id,
					date: currentDate,
					status: "LEAVE",
					leaveId: activeLeave.id,
					lateMinutes: 0,
					isOvertime: false,
					overtimeMinutes: 0,
					clockIn: null,
					clockOut: null,
				});
				continue;
			}

			const rand = Math.random();
			const baseStartHour = emp.isMorning ? 9 : 13;
			const baseEndHour = emp.isMorning ? 17 : 21;

			let clockInTime = new Date(currentDate);
			let clockOutTime = new Date(currentDate);
			let status: any = "PRESENT";
			let lateMinutes = 0;
			let isOvertime = false;
			let overtimeMinutes = 0;

			// Mock GPS dengan random offset kecil (pura-puranya absen di sekitar kantor)
			const mockLat = baseLat + (Math.random() * 0.0005 - 0.00025);
			const mockLng = baseLng + (Math.random() * 0.0005 - 0.00025);

			// Simulasi Auto Absent (5%)
			if (rand < 0.05) {
				attendanceData.push({
					employeeId: emp.id,
					date: currentDate,
					status: "ABSENT",
					lateMinutes: 0,
					isOvertime: false,
					overtimeMinutes: 0,
					clockIn: null,
					clockOut: null,
					isAutoAbsent: true, // 🔥 Simulasi cron job bekerja
					notes: "Auto absent by system at 23:55",
				});
				continue;
			}

			// Simulasi Terlambat (15%)
			if (rand >= 0.05 && rand < 0.2) {
				status = "LATE";
				lateMinutes = Math.floor(Math.random() * 45) + 16;
				clockInTime.setHours(baseStartHour, lateMinutes, 0);
			} else {
				// On Time
				const earlyMinutes = Math.floor(Math.random() * 30);
				clockInTime.setHours(baseStartHour - 1, 60 - earlyMinutes, 0);
			}

			// Simulasi Lupa Clock Out (5%)
			const clockOutRand = Math.random();
			let isAutoClockOut = false;
			let notes = null;

			if (clockOutRand < 0.05) {
				// Lupa absen pulang, dipulangkan paksa oleh sistem
				isAutoClockOut = true;
				notes = "Auto clock-out by system at 23:50";
				clockOutTime.setHours(baseEndHour, 0, 0); // Di-set persis di jam pulang shift
			}
			// Simulasi Lembur (25%)
			else if (clockOutRand >= 0.05 && clockOutRand < 0.3) {
				status = "OVERTIME";
				isOvertime = true;
				overtimeMinutes = Math.floor(Math.random() * 90) + 30;
				clockOutTime.setHours(baseEndHour, overtimeMinutes, 0);
			}
			// Pulang Normal
			else {
				const leaveLate = Math.floor(Math.random() * 15);
				clockOutTime.setHours(baseEndHour, leaveLate, 0);
			}

			attendanceData.push({
				employeeId: emp.id,
				date: currentDate,
				clockIn: clockInTime,
				clockOut: clockOutTime,
				status,
				lateMinutes,
				isOvertime,
				overtimeMinutes,
				clockInLat: mockLat, // 🔥 Simpan Koordinat
				clockInLng: mockLng,
				clockOutLat: mockLat,
				clockOutLng: mockLng,
				isAutoClockOut, // 🔥 Simpan Flag
				notes,
			});
		}
	}

	await prisma.attendance.createMany({
		data: attendanceData,
	});

	console.log(`✅ Berhasil membuat ${attendanceData.length} data absensi simulasi terintegrasi!`);
	console.log("🎉 Seeding selesai dengan sempurna!");
}

main()
	.catch((e) => {
		console.error("❌ Error saat seeding:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
