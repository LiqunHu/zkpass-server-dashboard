import { Request } from 'express'
import { simpleSelect, queryWithCount } from '@app/db'
import common from '@util/Common'
import { sbt_submit_api } from '@entities/sbt'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function getSubmitAPIListAct(req: Request) {
  const doc = common.docValidate(req),
    returnData = Object.create(null)

  let queryStr = `SELECT
    a.*,
    b.user_account,
    b.user_name 
  FROM
    tbl_sbt_submit_api a
    LEFT JOIN tbl_common_user b ON a.user_id = b.user_id 
  WHERE
    a.state = '1'`

  const replacements = []

  if (doc.sbt_submit_api_status) {
    queryStr += ' AND a.sbt_submit_api_status = ? '
    replacements.push(doc.sbt_submit_api_status)
  }

  if (doc.search_text) {
    queryStr += ' AND a.sbt_submit_api_domain LIKE ? '
    const search_text = '%' + doc.search_text + '%'
    replacements.push(search_text)
  }

  const result = await queryWithCount(doc, queryStr, replacements)

  returnData.total = result.count
  returnData.rows = result.data.map((item) => {
    item.sbt_submit_api_data =
      item.sbt_submit_api_data.length > 0
        ? JSON.parse(item.sbt_submit_api_data)
        : {}
    return item
  })

  return common.success(returnData)
}

async function modifySubmitAPIAct(req: Request) {
  const doc = common.docValidate(req)
  const api = await sbt_submit_api.findOne({
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
  const api = await sbt_submit_api.findOne({
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
