import express from 'express'
import DashboardControl from '@services/zkpass/DashboardControl'
const router = express.Router()

router.post('/dashboard/:method', DashboardControl)
export default router
