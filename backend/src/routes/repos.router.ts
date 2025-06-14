import { Router } from "express";
import { getRepos } from "../controllers/repos.controller";



const router = Router();

router.get("/", getRepos);


export default router;