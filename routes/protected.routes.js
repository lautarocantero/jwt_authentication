import express from 'express'
import { home } from '../controllers/protected.routes.js';

const router = express.Router();

router.get('/',home)

const protectedRoutes = router;

export default protectedRoutes;