import { Router, type IRouter } from "express";
import healthRouter from "./health";
import alignmentRouter from "./alignment";
import resourcesRouter from "./resources";
import lessonsRouter from "./lessons";
import feedRouter from "./feed";
import slidesRouter from "./slides";
import semesterPlanRouter from "./semesterPlan";
import compareRouter from "./compare";
import shareRouter from "./share";

const router: IRouter = Router();

router.use(healthRouter);
router.use(alignmentRouter);
router.use(resourcesRouter);
router.use(lessonsRouter);
router.use(feedRouter);
router.use(slidesRouter);
router.use(semesterPlanRouter);
router.use(compareRouter);
router.use(shareRouter);

export default router;
