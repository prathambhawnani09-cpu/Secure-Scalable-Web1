import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "./auth";
import { visitsRouter } from "./visits";
import { studentsRouter } from "./students";
import { alertsRouter } from "./alerts";
import { dashboardRouter } from "./dashboard";
import { notificationsRouter } from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/visits", visitsRouter);
router.use("/students", studentsRouter);
router.use("/alerts", alertsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/notifications", notificationsRouter);

export default router;
