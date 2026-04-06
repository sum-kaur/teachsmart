import { Router, type IRouter } from "express";
import healthRouter from "./health";
import alignmentRouter from "./alignment";
import resourcesRouter from "./resources";
import lessonsRouter from "./lessons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(alignmentRouter);
router.use(resourcesRouter);
router.use(lessonsRouter);

export default router;
