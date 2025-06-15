import { Router } from "express";
import { getRepos } from "../controllers/repos.controller";



const router = Router();

router.post("/", getRepos);


export default router;