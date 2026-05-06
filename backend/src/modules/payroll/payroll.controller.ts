import { Request, Response } from "express";
import { PayrollService } from "./payroll.service";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma";

export class PayrollController {
	static async generate(req: Request, res: Response) {
		try {
			const { employeeId, month, year } = req.body;
			const result = await PayrollService.generate(employeeId, Number(month), Number(year));
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async getAll(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const data = await PayrollService.getAll(user);
			res.json(data);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async generatePayslip(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const user = (req as any).user;

			const payroll = await prisma.payroll.findUnique({
				where: { id },
				include: {
					employee: { include: { user: true, department: true, position: true } },
				},
			});

			if (!payroll) throw new Error("Payroll not found");

			if (user.role === "EMPLOYEE" && payroll.employee.userId !== user.id) {
				return res.status(403).json({ error: "Forbidden: You cannot download someone else's payslip" });
			}

			// 🔥 AMBIL DATA SETTING & KOMPONEN UNTUK DITAMPILKAN DI PDF
			const lateSetting = await prisma.setting.findUnique({ where: { key: "LATE_PENALTY_PER_MINUTE" } });
			const latePenaltyRate = lateSetting && !isNaN(Number(lateSetting.value)) ? Number(lateSetting.value) : 1000;

			const components = await prisma.payrollComponent.findMany({ where: { isDefault: true } });
			const earnings = components.filter((c) => c.type === "EARNING");
			const componentDeductions = components.filter((c) => c.type === "DEDUCTION");

			const formatRp = (num: number) => {
				return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.round(num));
			};

			const doc = new PDFDocument({ margin: 50, size: "A4" });

			res.setHeader("Content-Type", "application/pdf");
			const safeName = payroll.employee.user.name.replace(/\s/g, "-");
			res.setHeader("Content-Disposition", `attachment; filename=Payslip-${safeName}-${payroll.month}-${payroll.year}.pdf`);

			doc.pipe(res);

			// KOP SURAT
			doc.font("Helvetica-Bold").fontSize(20).text("PT. SEJAHTERA AMIN", { align: "center" });
			doc.font("Helvetica").fontSize(10).text("Jl. Teknologi Maju No. 123, Ngamprah, Jawa Barat, 12345", { align: "center" });
			doc.text("Phone: (021) 1234-5678 | Email: hrd@sejahteraamin.co.id", { align: "center" });
			doc.moveDown().moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown();

			// JUDUL
			doc.font("Helvetica-Bold").fontSize(14).text("SALARY SLIP", { align: "center" });
			const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			doc
				.font("Helvetica")
				.fontSize(11)
				.text(`Period: ${monthNames[payroll.month - 1]} ${payroll.year}`, { align: "center" });
			doc.moveDown(2);

			// INFO KARYAWAN
			const startY = doc.y;
			doc.font("Helvetica-Bold").fontSize(10).text("Employee Information", 50, startY);
			doc
				.font("Helvetica")
				.text("Name", 50, startY + 15)
				.text(`: ${payroll.employee.user.name}`, 120, startY + 15);
			doc.text("Employee ID", 50, startY + 30).text(`: ${payroll.employee.code}`, 120, startY + 30);
			doc.text("Department", 320, startY + 15).text(`: ${payroll.employee.department.name}`, 390, startY + 15);
			doc.text("Position", 320, startY + 30).text(`: ${payroll.employee.position.name}`, 390, startY + 30);
			doc.moveDown(3);

			// TABEL RINCIAN GAJI
			const tableY = doc.y;
			doc.font("Helvetica-Bold");
			doc.text("Description", 50, tableY);
			doc.text("Earnings (+)", 250, tableY, { width: 120, align: "right" });
			doc.text("Deductions (-)", 420, tableY, { width: 120, align: "right" });
			doc
				.moveTo(50, tableY + 15)
				.lineTo(545, tableY + 15)
				.stroke();

			doc.font("Helvetica");
			let currentY = tableY + 25;

			// 1. Gaji Pokok
			doc.text("Base Salary", 50, currentY);
			doc.text(formatRp(payroll.baseSalary), 250, currentY, { width: 120, align: "right" });
			doc.text("-", 420, currentY, { width: 120, align: "right" });
			currentY += 20;

			// 2. Tunjangan Tambahan (Dinamis dari Komponen)
			earnings.forEach((c) => {
				doc.text(c.name, 50, currentY);
				doc.text(formatRp(c.amount), 250, currentY, { width: 120, align: "right" });
				doc.text("-", 420, currentY, { width: 120, align: "right" });
				currentY += 20;
			});

			// 3. Uang Lembur
			if (payroll.overtimePay > 0) {
				doc.text("Overtime Pay", 50, currentY);
				doc.text(formatRp(payroll.overtimePay), 250, currentY, { width: 120, align: "right" });
				doc.text("-", 420, currentY, { width: 120, align: "right" });
				currentY += 20;
			}

			// 4. Potongan Telat (Transparan dengan Rumus)
			if (payroll.totalLate > 0) {
				const latePenaltyAmount = payroll.totalLate * latePenaltyRate;
				doc.text(`Late Penalty (${payroll.totalLate} mins x ${formatRp(latePenaltyRate)})`, 50, currentY);
				doc.text("-", 250, currentY, { width: 120, align: "right" });
				doc.text(formatRp(latePenaltyAmount), 420, currentY, { width: 120, align: "right" });
				currentY += 20;
			}

			// 5. Potongan Alpha (Transparan)
			if (payroll.totalAbsent > 0) {
				const absentPenaltyAmount = payroll.totalAbsent * (payroll.baseSalary / 22);
				doc.text(`Absent Penalty (${payroll.totalAbsent} days)`, 50, currentY);
				doc.text("-", 250, currentY, { width: 120, align: "right" });
				doc.text(formatRp(absentPenaltyAmount), 420, currentY, { width: 120, align: "right" });
				currentY += 20;
			}

			// 6. Potongan Tambahan (Dinamis dari Komponen seperti BPJS)
			componentDeductions.forEach((c) => {
				doc.text(c.name, 50, currentY);
				doc.text("-", 250, currentY, { width: 120, align: "right" });
				doc.text(formatRp(c.amount), 420, currentY, { width: 120, align: "right" });
				currentY += 20;
			});

			// GARIS TOTAL
			doc
				.moveTo(50, currentY + 5)
				.lineTo(545, currentY + 5)
				.stroke();
			currentY += 20;

			// TOTAL TAKE HOME PAY
			doc.font("Helvetica-Bold").fontSize(12);
			doc.text("TOTAL TAKE HOME PAY", 50, currentY);
			doc.text(formatRp(payroll.totalSalary), 420, currentY, { width: 120, align: "right" });

			// TANDA TANGAN Bawah
			currentY += 60;
			doc.font("Helvetica").fontSize(10);
			doc.text("Prepared by,", 50, currentY);
			doc.text("Received by,", 400, currentY);

			currentY += 60;
			doc.text("_______________________", 50, currentY);
			doc.font("Helvetica-Bold").text("HR Department", 50, currentY + 15);

			doc.font("Helvetica").text("_______________________", 400, currentY);
			doc.font("Helvetica-Bold").text(payroll.employee.user.name, 400, currentY + 15);

			doc.end();
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async generateBulk(req: Request, res: Response) {
		try {
			const { month, year } = req.body;
			const result = await PayrollService.generateBulk(Number(month), Number(year));
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
