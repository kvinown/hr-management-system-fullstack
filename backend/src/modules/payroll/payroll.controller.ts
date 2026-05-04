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
			const data = await PayrollService.getAll();
			res.json(data);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
	static async generatePayslip(req: Request, res: Response) {
		try {
			const { id } = req.params;

			const payroll = await prisma.payroll.findUnique({
				where: { id },
				include: {
					employee: {
						include: {
							department: true,
							position: true,
						},
					},
				},
			});

			if (!payroll) throw new Error("Payroll not found");

			const doc = new PDFDocument();

			// 🔥 header response
			res.setHeader("Content-Type", "application/pdf");
			res.setHeader("Content-Disposition", `attachment; filename=payslip-${payroll.id}.pdf`);

			doc.pipe(res);

			// 🧾 CONTENT
			doc.fontSize(20).text("PAYSLIP", { align: "center" });
			doc.moveDown();

			doc.fontSize(12).text(`Name: ${payroll.employee.fullName}`);
			doc.text(`Department: ${payroll.employee.department.name}`);
			doc.text(`Position: ${payroll.employee.position.name}`);
			doc.text(`Month: ${payroll.month}/${payroll.year}`);
			doc.moveDown();

			doc.text(`Base Salary: ${payroll.baseSalary}`);
			doc.text(`Overtime Pay: ${payroll.overtimePay}`);
			doc.text(`Deductions: ${payroll.deductions}`);
			doc.moveDown();

			doc.fontSize(14).text(`Total Salary: ${payroll.totalSalary}`, {
				underline: true,
			});

			doc.end();
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
