import { Router } from "express";
import { authenticate, validate } from "@hom-nay-an-gi/shared";
import * as settingsController from "./settingsController.js";
import { updatePreferencesSchema } from "./settingsValidation.js";

const router = Router();

router.get("/preferences", authenticate, settingsController.getPreferences);
router.put(
  "/preferences",
  authenticate,
  validate(updatePreferencesSchema),
  settingsController.updatePreferences,
);

export { router as settingsRouter };
