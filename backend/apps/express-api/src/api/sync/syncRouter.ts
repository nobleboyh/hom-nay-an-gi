import { authenticate, validate } from "@hom-nay-an-gi/shared";
import { Router, type Router as RouterType } from "express";
import * as syncController from "./syncController.js";
import { syncPayloadSchema } from "./syncValidation.js";

export const syncRouter: RouterType = Router();

syncRouter.use(authenticate);

syncRouter.post("/", validate(syncPayloadSchema), syncController.sync);
