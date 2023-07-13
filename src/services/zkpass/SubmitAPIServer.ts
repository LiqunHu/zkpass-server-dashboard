import { Request } from 'express'
import _ from 'lodash'
import { simpleSelect } from '@app/db'
import common from '@util/Common'
import { sbt_submit_api } from '@entities/sbt'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function getSubmitAPIListAct(req: Request) {
  const doc = await common.docValidate(req),
    user = req.user,
    returnData = Object.create(null)

  if (Number(doc.search_text) + '' === doc.search_text) {
    if (doc.search_text.length < 9) {
      return common.error('base_01')
    }
  } else {
    if (doc.search_text.length < 2) {
      return common.error('base_01')
    }
  }

  let queryStr = `SELECT
      a.user_id,
      a.user_email,
      a.user_phone,
      a.user_name,
      a.user_avatar,
      b.user_wechat_nickname,
      b.user_wechat_headimgurl 
    FROM
      tbl_common_user a
      LEFT JOIN tbl_common_user_wechat b ON a.user_id = b.user_id 
    WHERE
      a.state = "1" 
      AND user_type = "00"`
  const replacements = []

  if (doc.search_text) {
    queryStr +=
      ' AND( user_email LIKE ? OR user_phone LIKE ? OR user_name LIKE ?)'
    const search_text = doc.search_text + '%'
    replacements.push(search_text)
    replacements.push(search_text)
    replacements.push(search_text)
  }

  queryStr += ' LIMIT 10'

  const result = await simpleSelect(queryStr, replacements)

  const uni = _.sortedUniqBy<any>(result, 'user_id')
  returnData.rows = []

  for (const r of uni) {
    returnData.rows.push({
      user_id: r.user_id,
      user_email: r.user_email,
      user_phone:
        r.user_phone.substring(0, 3) +
        '******' +
        r.user_phone.substring(r.user_phone.length - 3),
      user_name: r.user_name,
      user_avatar: r.user_avatar,
      nickname: r.user_wechat_nickname,
      headimgurl: r.user_wechat_headimgurl
    })
  }

  return common.success(returnData)
}

async function uploadAct(req: Request) {
  let rsp = await common.fileSaveTemp(req)

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
      sbt_submit_api_data: doc.requests
    })
    .save()

  return common.success()
}

export default {
  getSubmitAPIListAct,
  uploadAct,
  submitAPIAct
}
