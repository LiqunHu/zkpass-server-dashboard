import { Request } from 'express'
import _ from 'lodash'
import { simpleSelect, queryWithCount } from '@app/db'
import common from '@util/Common'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function getTaskListAct(req: Request) {
  const doc = common.docValidate(req),
    returnData = Object.create(null)

  let queryStr = `SELECT * FROM tbl_sbt_task WHERE state='1' AND sbt_task_status = '1'`

  const replacements = []

  if (doc.sbt_task_country_code) {
    queryStr += ' AND sbt_task_country_code = ? '
    replacements.push(doc.sbt_task_country_code)
  }

  if (doc.sbt_task_category) {
    queryStr += ' AND sbt_task_category = ? '
    replacements.push(doc.sbt_task_category)
  }

  if (doc.search_text) {
    queryStr += ' AND sbt_task_domain LIKE ? '
    const search_text = '%' + doc.search_text + '%'
    replacements.push(search_text)
  }

  const result = await queryWithCount(doc, queryStr, replacements)

  returnData.total = result.count
  returnData.rows = result.data

  return common.success(returnData)
}

export default {
  getTaskListAct
}
