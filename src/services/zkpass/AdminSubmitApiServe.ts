import { Request } from 'express'
import { simpleSelect, queryWithCount } from '@app/db'
import common from '@util/Common'
import { sbt_submit_api } from '@entities/sbt'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function getSubmitAPIListAct(req: Request) {
  const doc = common.docValidate(req),
    returnData = Object.create(null)

  let queryStr = `SELECT * FROM tbl_sbt_task WHERE state='1' AND sbt_task_status = '1' AND state = '1'`

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
    queryStr += ' AND sbt_task_url LIKE ? '
    const search_text = '%' + doc.search_text + '%'
    replacements.push(search_text)
  }

  const result = await queryWithCount(doc, queryStr, replacements)

  returnData.total = result.count
  returnData.rows = result.data

  return common.success(returnData)
}

async function modifySubmitAPIAct(req: Request) {
  const doc = common.docValidate(req)
  let api = await sbt_submit_api.findOne({
    where: {
      sbt_submit_api_id: doc.sbt_submit_api_id
    }
  })

  if (api) {
    if (doc.sbt_submit_api_status) {
      api.sbt_submit_api_status = doc.sbt_submit_api_status
    }
    await api.save()
  } else {
    return common.error('common_api_02')
  }

  return common.success()
}

async function deleteSubmitAPIAct(req: Request) {
  const doc = common.docValidate(req)
  let api = await sbt_submit_api.findOne({
    where: {
      sbt_submit_api_id: doc.sbt_submit_api_id
    }
  })

  if (api) {
    api.base.state = '0'
    await api.save()
  } else {
    return common.error('common_api_02')
  }

  return common.success()
}

export default {
  getSubmitAPIListAct,
  modifySubmitAPIAct,
  deleteSubmitAPIAct
}
