import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// HR & SUPER ADMIN ONLY
router.post("/", authenticate, authorize("SUPER_ADMIN", "HR_ADMIN"), EmployeeController.create);

router.get("/", authenticate, authorize("SUPER_ADMIN", "HR_ADMIN"), EmployeeController.getAll);

router.get("/:id", authenticate, authorize("SUPER_ADMIN", "HR_ADMIN"), EmployeeController.getById);

router.put("/:id", authenticate, authorize("SUPER_ADMIN", "HR_ADMIN"), EmployeeController.update);

router.delete("/:id", authenticate, authorize("SUPER_ADMIN", "SUPER_ADMIN"), EmployeeController.delete);

export default router;
