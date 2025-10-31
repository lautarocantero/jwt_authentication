
import express from 'express'

import { home, login, logout, refresh, register } from '../controllers/auth.controller.js';
// agrupo mis endpoints
const router = express.Router();
// ruta por defecto
router.get('/', home)
// endpoint de logueo
router.post('/login', login)

router.post('/register', register)

router.post('/logout', logout);

router.post('/refresh', refresh);

const authRoutes = router

export default authRoutes 