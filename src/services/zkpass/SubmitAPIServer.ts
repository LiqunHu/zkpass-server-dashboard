import { Request } from 'express'
import _ from 'lodash'
import { simpleSelect, queryWithCount } from '@app/db'
import common from '@util/Common'
import { sbt_submit_api } from '@entities/sbt'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function getSubmitAPIListAct(req: Request) {
  const doc = await common.docValidate(req),
    user = req.user,
    returnData = Object.create(null)

  const queryStr = `SELECT * FROM tbl_sbt_submit_api WHERE user_id=?`
  const replacements = [user.user_id]

  const result = await queryWithCount(doc, queryStr, replacements)

  returnData.total = result.count
  returnData.rows = result.data.map((item)=> {
    item.sbt_submit_api_data = item.sbt_submit_api_data.length > 0 ? JSON.parse(item.sbt_submit_api_data) : {}
    return item
  })

  return common.success(returnData)
}

async function uploadAct(req: Request) {
  const rsp = await common.fileSaveTemp(req)

  return common.success(rsp)
}

async function submitAPIAct(req: Request) {
  const doc = await common.docValidate(req),
    user = req.user

  await sbt_submit_api
    .create({
      user_id: user.user_id,
      sbt_submit_api_domain: doc.domain,
      sbt_submit_api_country_code: doc.country,
      sbt_submit_api_category: doc.category,
      sbt_submit_api_discord: doc.discord,
      sbt_submit_api_description: doc.describe,
      sbt_submit_api_images: doc.files,
      sbt_submit_api_data: JSON.stringify(doc.requests)
    })
    .save()

  return common.success()
}

export default {
  getSubmitAPIListAct,
  uploadAct,
  submitAPIAct
}
