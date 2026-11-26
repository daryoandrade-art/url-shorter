import { Router } from "express";
import { shortenUrl, redirectUrl, getUrlStatus } from "../controllers/url.controller.js";

const router = Router();

router.post('/shorten', shortenUrl);
router.get('/status/:code', getUrlStatus);
router.get('/:code', redirectUrl);

export default router;