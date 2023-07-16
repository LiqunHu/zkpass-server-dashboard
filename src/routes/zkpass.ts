import express from 'express'
import DashboardControl from '@services/zkpass/DashboardControl'
import SubmitAPIControl from '@services/zkpass/SubmitAPIControl'
import AdminTaskControl from '@services/zkpass/AdminTaskControl'
import AdminSubmitApiControl from '@services/zkpass/AdminSubmitApiControl'
const router = express.Router()

router.post('/dashboard/:method', DashboardControl)
router.post('/submitapi/:method', SubmitAPIControl)
router.post('/adminTask/:method', AdminTaskControl)
router.post('/adminSubmitApi/:method', AdminSubmitApiControl)
export default router
