import { Not } from 'typeorm'
import { Request } from 'express'
import { redisClient } from 'node-srv-utils'
import common from '@util/Common'
import GLBConfig from '@util/GLBConfig'
import { simpleSelect, queryWithCount } from '@app/db'

import {
  common_user,
  common_usergroup,
  common_user_groups,
} from '@entities/common'
import { createLogger } from '@app/logger'
const logger = createLogger(__filename)

async function initAct() {
  const returnData = Object.create(null)

  const groups: {
    id: number
    text: string
    disabled: boolean
  }[] = []

  async function genUserGroup(parentId: string, lev: number) {
    const actgroups = await common_usergroup.findBy({
      parent_id: parentId,
      usergroup_type: GLBConfig.USER_TYPE.TYPE_DEFAULT,
      organization_id: 0,
    })
    for (const g of actgroups) {
      if (g.node_type === GLBConfig.NODE_TYPE.NODE_ROOT) {
        groups.push({
          id: g.usergroup_id,
          text: '--'.repeat(lev) + g.usergroup_name,
          disabled: true,
        })
        await genUserGroup(g.usergroup_id + '', lev + 1)
      } else {
        groups.push({
          id: g.usergroup_id,
          text: '--'.repeat(lev) + g.usergroup_name,
          disabled: false,
        })
      }
    }
  }

  await genUserGroup('0', 0)
  returnData.groupInfo = groups

  return common.success(returnData)
}

async function searchAct(req: Request) {
  const doc = common.docValidate(req),
    returnData = Object.create(null)

  let queryStr =
    'select * from tbl_common_user where state = "1" and user_type = "' +
    GLBConfig.USER_TYPE.TYPE_DEFAULT +
    '"'
  const replacements = []

  if (doc.search_text) {
    queryStr +=
      ' and (user_username like ? or user_email like ? or user_phone like ? or user_name like ? or user_address like ? or user_account like ?)'
    const search_text = '%' + doc.search_text + '%'
    replacements.push(search_text)
    replacements.push(search_text)
    replacements.push(search_text)
    replacements.push(search_text)
    replacements.push(search_text)
    replacements.push(search_text)
  }

  const result = await queryWithCount(doc, queryStr, replacements)

  returnData.total = result.count
  returnData.rows = []

  for (const ap of result.data) {
    ap.user_groups = []
    const user_groups = await common_user_groups.findBy({
      user_id: ap.user_id,
    })
    for (const g of user_groups) {
      ap.user_groups.push(g.usergroup_id)
    }
    delete ap.user_password
    returnData.rows.push(ap)
  }

  return common.success(returnData)
}

async function addAct(req: Request) {
  const doc = common.docValidate(req)
  let groupCheckFlag = true

  for (const gid of doc.user_groups) {
    const usergroup = await common_usergroup.findOneBy({
      usergroup_id: gid,
    })
    if (!usergroup) {
      groupCheckFlag = false
      break
    }
  }

  if (groupCheckFlag) {
    let adduser = await common_user.findOne({
      where: [
        { user_phone: doc.user_phone },
        { user_username: doc.user_username },
      ],
    })
    if (adduser) {
      return common.error('operator_02')
    }
    adduser = await common_user.create({
      user_type: GLBConfig.USER_TYPE.TYPE_DEFAULT,
      user_username: doc.user_username,
      user_email: doc.user_email,
      user_phone: doc.user_phone,
      user_password: GLBConfig.INITPASSWORD,
      user_name: doc.user_name,
      user_gender: doc.user_gender,
      user_address: doc.user_address,
      user_zipcode: doc.user_zipcode,
    }).save()

    for (const gid of doc.user_groups) {
      await common_user_groups.create({
        user_id: adduser.user_id,
        usergroup_id: gid,
      }).save()
    }

    const returnData = JSON.parse(JSON.stringify(adduser))
    delete returnData.user_password
    returnData.user_groups = doc.user_groups

    return common.success(returnData)
  } else {
    return common.error('operator_01')
  }
}

async function modifyAct(req: Request) {
  const doc = common.docValidate(req)

  const modiuser = await common_user.findOneBy({
    user_id: doc.user_id,
    base: {
      state: GLBConfig.ENABLE,
    }
  })
  if (modiuser) {
    if (doc.user_email) {
      const emailuser = await common_user.findOneBy({
        user_id: Not(modiuser.user_id),
        user_email: doc.user_email,
      })
      if (emailuser) {
        return common.error('operator_02')
      }
    }

    if (doc.user_phone) {
      const phoneuser = await common_user.findOneBy({
          user_id: Not(modiuser.user_id),
          user_phone: doc.user_phone,
      })
      if (phoneuser) {
        return common.error('operator_02')
      }
    }

    modiuser.user_email = doc.user_email
    modiuser.user_phone = doc.user_phone
    modiuser.user_name = doc.user_name
    modiuser.user_gender = doc.user_gender
    modiuser.user_avatar = doc.user_avatar
    modiuser.user_address = doc.user_address
    modiuser.user_zipcode = doc.user_zipcode
    await modiuser.save()

    const queryStr = `SELECT
        a.user_groups_id,
        a.usergroup_id 
      FROM
        tbl_common_user_groups a,
        tbl_common_usergroup b 
      WHERE
        a.usergroup_id = b.usergroup_id 
        AND b.organization_id = 0 
        AND a.user_id = ?`
    const groups = await simpleSelect(queryStr, [modiuser.user_id])
    const existids = []
    for (const g of groups) {
      if (doc.user_groups.indexOf(g.usergroup_id) < 0) {
        await common_user_groups.delete({
          user_groups_id: g.user_groups_id,
        })
      } else {
        existids.push(g.usergroup_id)
      }
    }

    for (const gid of doc.user_groups) {
      if (existids.indexOf(gid) < 0) {
        await common_user_groups.create({
          user_id: modiuser.user_id,
          usergroup_id: gid,
        }).save()
      }
    }

    const returnData = JSON.parse(JSON.stringify(modiuser))
    delete returnData.user_password
    returnData.user_groups = doc.user_groups
    logger.debug('modify success')
    return common.success(returnData)
  } else {
    return common.error('operator_03')
  }
}

async function deleteAct(req: Request) {
  const doc = common.docValidate(req)

  const deluser = await common_user.findOneBy({
    user_id: doc.user_id,
    base: {
      state: GLBConfig.ENABLE,
    }
  })

  if (deluser) {
    deluser.base.state = GLBConfig.DISABLE
    await deluser.save()
    redisClient.del(
      [GLBConfig.REDIS_KEYS.AUTH, 'WEB', deluser.user_id].join('_')
    )
    redisClient.del(
      [GLBConfig.REDIS_KEYS.AUTH, 'MOBILE', deluser.user_id].join('_')
    )
    return common.success()
  } else {
    return common.error('operator_03')
  }
}

export default {
  initAct,
  searchAct,
  addAct,
  modifyAct,
  deleteAct,
}
