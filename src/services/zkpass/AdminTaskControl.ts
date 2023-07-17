import { Request, Response } from 'express'
import common from '@util/Common'
import srv from './AdminTaskServer'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

export default async function (req: Request, res: Response) {
  try {
    const method = await common.reqTrans(req, __filename)
    let ret = 'common_01'
    logger.debug(method)

    if (method === 'getTaskList') {
      ret = await srv.getTaskListAct(req)
    } else if (method === 'addTask') {
      ret = await srv.addTaskAct(req)
    } else if (method === 'modifyTask') {
      ret = await srv.modifyTaskAct(req)
    } else if (method === 'deleteTask') {
      ret = await srv.deleteTaskAct(req)
    }

    common.sendData(res, ret)
  } catch (error) {
    common.sendFault(res, error)
  }
}
