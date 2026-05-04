import { Router } from "express";
import { PositionController } from "./position.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", authenticate, PositionController.getAll);

router.post("/", authenticate, authorize("HR_ADMIN"), PositionController.create);
router.put("/:id", authenticate, authorize("HR_ADMIN"), PositionController.update);
router.delete("/:id", authenticate, authorize("HR_ADMIN"), PositionController.delete);

export default router;
