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
			const user = (req as any).user; // 🔥 Tangkap data user dari token
			const data = await PayrollService.getAll(user); // Lempar ke service
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
					employee: {
						include: {
							user: true,
							department: true,
							position: true,
						},
					},
				},
			});

			if (!payroll) throw new Error("Payroll not found");

			// 🔒 KEAMANAN EXTRA: Jika dia Employee, pastikan ini slip gajinya sendiri!
			if (user.role === "EMPLOYEE" && payroll.employee.userId !== user.id) {
				return res.status(403).json({ error: "Forbidden: You cannot download someone else's payslip" });
			}

			// 🔥 Helper untuk merubah angka ke Rupiah tanpa desimal aneh
			const formatRp = (num: number) => {
				return new Intl.NumberFormat("id-ID", {
					style: "currency",
					currency: "IDR",
					maximumFractionDigits: 0,
				}).format(Math.round(num)); // Pembulatan angka
			};

			const doc = new PDFDocument({ margin: 50, size: "A4" });

			// Header Response
			res.setHeader("Content-Type", "application/pdf");
			const safeName = payroll.employee.user.name.replace(/\s/g, "-");
			res.setHeader("Content-Disposition", `attachment; filename=Payslip-${safeName}-${payroll.month}-${payroll.year}.pdf`);

			doc.pipe(res);

			// ==========================================
			// 🏢 KOP SURAT (HEADER)
			// ==========================================
			doc.font("Helvetica-Bold").fontSize(20).text("PT. HR SYSTEM NUSANTARA", { align: "center" });
			doc.font("Helvetica").fontSize(10).text("Jl. Teknologi Maju No. 123, Jakarta Selatan, 12345", { align: "center" });
			doc.text("Phone: (021) 1234-5678 | Email: hrd@hrsystem.co.id", { align: "center" });

			// Garis Pemisah
			doc.moveDown();
			doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
			doc.moveDown();

			// ==========================================
			// 📄 JUDUL DOKUMEN
			// ==========================================
			doc.font("Helvetica-Bold").fontSize(14).text("SALARY SLIP", { align: "center" });

			const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			doc
				.font("Helvetica")
				.fontSize(11)
				.text(`Period: ${monthNames[payroll.month - 1]} ${payroll.year}`, { align: "center" });
			doc.moveDown(2);

			// ==========================================
			// 👤 INFO KARYAWAN
			// ==========================================
			const startY = doc.y;
			doc.font("Helvetica-Bold").fontSize(10).text("Employee Information", 50, startY);

			// Kolom Kiri
			doc
				.font("Helvetica")
				.text("Name", 50, startY + 15)
				.text(`: ${payroll.employee.user.name}`, 120, startY + 15);
			doc.text("Employee ID", 50, startY + 30).text(`: ${payroll.employee.code}`, 120, startY + 30);

			// Kolom Kanan
			doc.text("Department", 320, startY + 15).text(`: ${payroll.employee.department.name}`, 390, startY + 15);
			doc.text("Position", 320, startY + 30).text(`: ${payroll.employee.position.name}`, 390, startY + 30);

			doc.moveDown(3);

			// ==========================================
			// 💰 RINCIAN GAJI (TABEL)
			// ==========================================
			const tableY = doc.y;

			// Header Tabel
			doc.font("Helvetica-Bold");
			doc.text("Description", 50, tableY);
			doc.text("Earnings (+)", 250, tableY, { width: 120, align: "right" });
			doc.text("Deductions (-)", 420, tableY, { width: 120, align: "right" });

			doc
				.moveTo(50, tableY + 15)
				.lineTo(545, tableY + 15)
				.stroke();

			// Baris 1: Gaji Pokok
			doc.font("Helvetica");
			doc.text("Base Salary", 50, tableY + 25);
			doc.text(formatRp(payroll.baseSalary), 250, tableY + 25, { width: 120, align: "right" });
			doc.text("-", 420, tableY + 25, { width: 120, align: "right" });

			// Baris 2: Lembur
			doc.text("Overtime Pay", 50, tableY + 45);
			doc.text(formatRp(payroll.overtimePay), 250, tableY + 45, { width: 120, align: "right" });
			doc.text("-", 420, tableY + 45, { width: 120, align: "right" });

			// Baris 3: Potongan (Telat/Absen)
			doc.text("Late / Absent Penalty", 50, tableY + 65);
			doc.text("-", 250, tableY + 65, { width: 120, align: "right" });
			doc.text(formatRp(payroll.deductions), 420, tableY + 65, { width: 120, align: "right" });

			// Garis Pemisah Total
			doc
				.moveTo(50, tableY + 85)
				.lineTo(545, tableY + 85)
				.stroke();

			// ==========================================
			// 💵 TOTAL TAKE HOME PAY
			// ==========================================
			doc.font("Helvetica-Bold").fontSize(12);
			doc.text("TOTAL TAKE HOME PAY", 50, tableY + 100);
			doc.text(formatRp(payroll.totalSalary), 420, tableY + 100, { width: 120, align: "right" });

			// ==========================================
			// ✍️ TANDA TANGAN
			// ==========================================
			doc.moveDown(5);
			const signY = doc.y;
			doc.font("Helvetica").fontSize(10);

			doc.text("Prepared by,", 50, signY);
			doc.text("Received by,", 400, signY);

			// Garis Tanda tangan
			doc.text("_______________________", 50, signY + 60);
			doc.font("Helvetica-Bold").text("HR Department", 50, signY + 75);

			doc.font("Helvetica").text("_______________________", 400, signY + 60);
			doc.font("Helvetica-Bold").text(payroll.employee.user.name, 400, signY + 75);

			// Tutup Dokumen
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
