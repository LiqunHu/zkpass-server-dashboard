import { Request } from 'express'
import { queryWithCount } from '@app/db'
import common from '@util/Common'
import { sbt_task } from '@entities/sbt'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function getTaskListAct(req: Request) {
  const doc = common.docValidate(req),
    returnData = Object.create(null)

  let queryStr = `SELECT * FROM tbl_sbt_task WHERE state='1' AND sbt_task_status = '1' `

  const replacements = []

  if (doc.sbt_task_country_code) {
    queryStr += ' AND sbt_task_country_code = ? '
    replacements.push(doc.sbt_task_country_code)
  }

  if (doc.sbt_task_category) {
    queryStr += ' AND sbt_task_category = ? '
    replacements.push(doc.sbt_task_category)
  }

  if (doc.sbt_task_status) {
    queryStr += ' AND sbt_task_status = ? '
    replacements.push(doc.sbt_task_status)
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

async function addTaskAct(req: Request) {
  const doc = common.docValidate(req)
  await sbt_task
    .create({
      sbt_task_country_code: doc.sbt_task_country_code,
      sbt_task_category: doc.sbt_task_category,
      sbt_task_domain: doc.sbt_task_domain,
      sbt_task_requirements: doc.sbt_task_requirements,
      sbt_task_reward: doc.sbt_task_reward,
      sbt_task_status: doc.sbt_task_status
    })
    .save()
  return common.success()
}

async function modifyTaskAct(req: Request) {
  const doc = common.docValidate(req)
  const task = await sbt_task.findOne({
    where: {
      sbt_task_id: doc.sbt_task_id
    }
  })

  if (task) {
    if (doc.sbt_task_country_code) {
      task.sbt_task_country_code = doc.sbt_task_country_code
    }
    if (doc.sbt_task_category) {
      task.sbt_task_category = doc.sbt_task_category
    }
    if (doc.sbt_task_domain) {
      task.sbt_task_domain = doc.sbt_task_domain
    }
    if (doc.sbt_task_requirements) {
      task.sbt_task_requirements = doc.sbt_task_requirements
    }
    if (doc.sbt_task_reward) {
      task.sbt_task_reward = doc.sbt_task_reward
    }
    if (doc.sbt_task_status) {
      task.sbt_task_status = doc.sbt_task_status
    }
    await task.save()
  } else {
    return common.error('common_api_02')
  }

  return common.success()
}

async function deleteTaskAct(req: Request) {
  const doc = common.docValidate(req)
  const task = await sbt_task.findOne({
    where: {
      sbt_task_id: doc.sbt_task_id
    }
  })

  if (task) {
    task.base.state = '0'
    await task.save()
  } else {
    return common.error('common_api_02')
  }

  return common.success()
}

export default {
  getTaskListAct,
  addTaskAct,
  modifyTaskAct,
  deleteTaskAct
}
