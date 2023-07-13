import express from 'express'
import DashboardControl from '@services/zkpass/DashboardControl'
import SubmitAPIControl from '@services/zkpass/SubmitAPIControl'
const router = express.Router()

router.post('/dashboard/:method', DashboardControl)
router.post('/submitapi/:method', SubmitAPIControl)
export default router
