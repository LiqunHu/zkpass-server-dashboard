import { Request } from 'express'
import _ from 'lodash'
import dayjs from 'dayjs'
import config from 'config'
import { redisClient, authority, alisms } from 'node-srv-utils'
import svgCaptcha from 'svg-captcha'
import { v1 as uuidV1 } from 'uuid'
import phone from 'phone'
import { simpleSelect } from '@app/db'
import common from '@util/Common'
import GLBConfig from '@util/GLBConfig'
import {
  common_user,
  common_usergroup,
  common_user_groups,
  common_user_wechat
} from '@entities/common'
import { createLogger } from '@app/logger'
import { Web3 } from 'web3'
const httpRPC = 'https://data-seed-prebsc-1-s1.binance.org:8545'
const web3js = new Web3(httpRPC)

const logger = createLogger(__filename)

async function signinAct(req: Request) {
  const doc = await common.docValidate(req)

  if (
    doc.login_type === 'WEB' ||
    doc.login_type === 'ADMIN' ||
    doc.login_type === 'MOBILE' ||
    doc.login_type === 'SYSTEM'
  ) {
    const user = await common_user.findOne({
      where: [
        { user_phone: doc.username, base: { state: GLBConfig.ENABLE } },
        { user_username: doc.username, base: { state: GLBConfig.ENABLE } }
      ]
    })

    if (!user) {
      return common.error('auth_03')
    }

    if (user.user_password_error < 0) {
      return common.error('auth_03')
    }

    const decrypted = await authority.aesDecryptModeCBC(
      doc.identify_code,
      user.user_password
    )

    if (
      decrypted != '' &&
      (decrypted === user.user_username || decrypted === user.user_phone)
    ) {
      const session_token = authority.user2token(doc.login_type, user.user_id)
      const loginData = await loginInit(user, session_token, doc.login_type)

      if (loginData) {
        loginData.Authorization = session_token
        user.user_password_error = 0
        user.user_login_time = new Date()
        await user.save()
        return common.success(loginData)
      } else {
        user.user_password_error += 1
        await user.save()
        return common.error('auth_03')
      }
    } else {
      return common.error('auth_03')
    }
  } else {
    return common.error('auth_19')
  }
}

async function captchaAct() {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1i',
    noise: 2,
    color: true
  })

  let code = captcha.text
  if (process.env.NODE_ENV === 'dev') {
    code = 'aaaa'
  }

  const key = GLBConfig.REDIS_KEYS.CAPTCHA + '_' + uuidV1().replace(/-/g, '')
  await redisClient.set(
    key,
    {
      code: code
    },
    'EX',
    config.get<number>('security.CAPTCHA_TOKEN_AGE')
  )
  logger.debug(code)

  return common.success({ key: key, captcha: captcha.data })
}

async function loginSmsAct(req: Request) {
  const doc = common.docValidate(req)

  if (!doc.key) {
    return common.error('auth_04')
  }
  if (!doc.code) {
    return common.error('auth_04')
  }
  const captchaData = await redisClient.get(doc.key)
  if (!captchaData) {
    return common.error('auth_04')
  }

  if (captchaData.code.toUpperCase() !== doc.code.toUpperCase()) {
    return common.error('auth_04')
  }

  let code = common.generateRandomAlphaNum(4)
  if (process.env.NODE_ENV === 'dev') {
    code = '1111'
  }
  const smsExpiredTime = config.get<number>('security.SMS_TOKEN_AGE')
  const key = [GLBConfig.REDIS_KEYS.SMS, doc.user_phone].join('_')

  const liveTime = await redisClient.ttl(key)
  logger.debug(liveTime)
  logger.debug(code)
  if (liveTime > 0) {
    if (smsExpiredTime - liveTime < 70) {
      return common.error('auth_06')
    }
  }

  if (process.env.NODE_ENV !== 'dev') {
    try {
      await alisms.sendSms({
        PhoneNumbers: doc.user_phone,
        SignName: '京瀚科技',
        TemplateCode: 'SMS_175580288',
        TemplateParam: JSON.stringify({
          code: code
        })
      })
    } catch (error) {
      logger.error(error)
      return common.error('auth_17')
    }
  }

  await redisClient.set(
    key,
    {
      code: code
    },
    'EX',
    smsExpiredTime
  )

  return common.success()
}

async function signinBySmsAct(req: Request) {
  const doc = common.docValidate(req)

  const msgkey = [GLBConfig.REDIS_KEYS.SMS, doc.user_phone].join('_')
  const rdsData = await redisClient.get(msgkey)

  if (!rdsData) {
    return common.error('auth_04')
  } else if (doc.code !== rdsData.code) {
    return common.error('auth_04')
  } else {
    let user = await common_user.findOneBy({
      user_phone: doc.user_phone
    })

    if (!user) {
      const group = await common_usergroup.findOneBy({
        usergroup_code: 'DEFAULT'
      })

      if (!group) {
        return common.error('auth_10')
      }

      user = await common_user
        .create({
          user_type: GLBConfig.USER_TYPE.TYPE_DEFAULT,
          user_username: doc.user_phone,
          user_phone: doc.user_phone,
          user_password: common.generateRandomAlphaNum(6),
          user_password_error: -1
        })
        .save()

      await common_user_groups
        .create({
          user_id: user.user_id,
          usergroup_id: group.usergroup_id
        })
        .save()

      user = await common_user.findOneBy({
        user_id: user.user_id
      })
    }

    if (user) {
      const session_token = authority.user2token(doc.login_type, user.user_id)
      const loginData = await loginInit(user, session_token, doc.login_type)

      if (loginData) {
        loginData.Authorization = session_token
        redisClient.del(msgkey)

        user.user_login_time = new Date()
        await user.save()
        return common.success(loginData)
      } else {
        return common.error('auth_03')
      }
    }
  }
}

async function signinByAccountAct(req: Request) {
  const doc = common.docValidate(req)
  const signAddress = web3js.eth.accounts.recover('join zpkass', doc.signature)
  if (doc.address == signAddress) {
    let user = await common_user.findOneBy({
      user_account: doc.address
    })
    if (!user) {
      const group = await common_usergroup.findOneBy({
        usergroup_code: 'DEFAULT'
      })

      if (!group) {
        return common.error('auth_10')
      }

      user = await common_user
        .create({
          user_type: GLBConfig.USER_TYPE.TYPE_DEFAULT,
          user_account: doc.address,
          user_password: common.generateRandomAlphaNum(6),
          user_password_error: -1
        })
        .save()

      await common_user_groups
        .create({
          user_id: user.user_id,
          usergroup_id: group.usergroup_id
        })
        .save()

      user = await common_user.findOneBy({
        user_id: user.user_id
      })
    }

    if (user) {
      const session_token = authority.user2token(doc.login_type, user.user_id)
      const loginData = await loginInit(user, session_token, doc.login_type)

      if (loginData) {
        loginData.Authorization = session_token

        user.user_login_time = new Date()
        await user.save()
        return common.success(loginData)
      } else {
        return common.error('auth_03')
      }
    }
  } else {
    return common.error('auth_03')
  }
}

async function signoutAct(req: Request) {
  const tokenData = await authority.tokenVerify(req)
  if (tokenData) {
    const type = tokenData.type,
      user_id = tokenData.user_id
    await redisClient.del([GLBConfig.REDIS_KEYS.AUTH, type, user_id].join('_'))
  }
  return common.success()
}

async function userExistAct(req: Request) {
  const doc = common.docValidate(req)
  const user = await common_user.findOne({
    where: [
      { user_phone: doc.user_username },
      { user_username: doc.user_username }
    ]
  })
  if (user) {
    return common.error('auth_02')
  } else {
    return common.success()
  }
}

async function registerSmsAct(req: Request) {
  const doc = common.docValidate(req)
  let msgphone = ''

  if (!doc.key) {
    return common.error('auth_04')
  }
  if (!doc.code) {
    return common.error('auth_04')
  }
  const captchaData = await redisClient.get(doc.key)
  if (!captchaData) {
    return common.error('auth_04')
  }

  if (captchaData.code.toUpperCase() !== doc.code.toUpperCase()) {
    return common.error('auth_04')
  }

  const phoneCheck = phone('+' + doc.country_code + doc.user_phone)
  if (!phoneCheck.isValid) {
    return common.error('auth_13')
  }

  if (phoneCheck.countryCode === 'CHN') {
    // 中国
    if (doc.country_code !== '86') {
      return common.error('auth_13')
    }
    msgphone = doc.user_phone
  } else {
    return common.error('auth_13')
  }

  let code = common.generateRandomAlphaNum(4)
  if (process.env.NODE_ENV === 'dev') {
    code = '1111'
  }
  const smsExpiredTime = config.get<number>('security.SMS_TOKEN_AGE')
  const key = [GLBConfig.REDIS_KEYS.SMS, msgphone].join('_')

  const liveTime = await redisClient.ttl(key)
  logger.debug(liveTime)
  logger.debug(code)
  logger.debug(msgphone)
  if (liveTime > 0) {
    if (smsExpiredTime - liveTime < 70) {
      return common.error('auth_06')
    }
  }

  if (process.env.NODE_ENV !== 'dev') {
    try {
      await alisms.sendSms({
        PhoneNumbers: msgphone,
        SignName: '京瀚科技',
        TemplateCode: 'SMS_175580288',
        TemplateParam: JSON.stringify({
          code: code
        })
      })
    } catch (error) {
      logger.error(error)
      return common.error('auth_17')
    }
  }

  await redisClient.set(
    key,
    {
      code: code
    },
    'EX',
    smsExpiredTime
  )

  return common.success()
}

async function registerAct(req: Request) {
  const doc = common.docValidate(req)
  let msgphone = ''
  let user = await common_user.findOne({
    where: [
      { user_phone: doc.user_phone },
      { user_username: doc.user_username }
    ]
  })
  if (user) {
    return common.error('auth_02')
  } else {
    if (doc.country_code === '86') {
      msgphone = doc.user_phone
    } else {
      msgphone = doc.country_code + doc.user_phone
    }

    const smskey = [GLBConfig.REDIS_KEYS.SMS, msgphone].join('_')
    const rdsData = await redisClient.get(smskey)

    if (!rdsData) {
      return common.error('auth_04')
    } else if (doc.code != rdsData.code) {
      return common.error('auth_04')
    } else {
      await redisClient.del(smskey)
      const group = await common_usergroup.findOneBy({
        usergroup_code: 'DEFAULT'
      })

      if (!group) {
        return common.error('auth_10')
      }

      user = await common_user
        .create({
          user_type: GLBConfig.USER_TYPE.TYPE_DEFAULT,
          user_username: doc.user_username,
          user_country_code: doc.country_code,
          user_phone: doc.user_phone,
          user_password: doc.user_password,
          user_name: doc.user_name || ''
        })
        .save()

      await common_user_groups
        .create({
          user_id: user.user_id,
          usergroup_id: group.usergroup_id
        })
        .save()

      // login
      user = await common_user.findOneBy({
        user_id: user.user_id
      })
      if (!user) {
        return common.error('auth_02')
      }
      const session_token = authority.user2token('WEB', user.user_id)
      const loginData = await loginInit(user, session_token, 'WEB')
      if (loginData) {
        loginData.Authorization = session_token
        return common.success(loginData)
      } else {
        return common.error('auth_03')
      }
    }
  }
}

async function loginInit(
  user: common_user,
  session_token: string,
  type: string
) {
  try {
    const returnData = Object.create(null)
    returnData.avatar = user.user_avatar
    returnData.user_id = user.user_id
    returnData.username = user.user_username
    returnData.name = user.user_name
    returnData.phone = user.user_phone
    returnData.address = user.user_account
    returnData.user_email = user.user_email
    returnData.created_at = dayjs(user.base.created_at).format('YYYYMMDD')
    returnData.city = user.user_city
    returnData.password_state = user.user_password_error

    const wechat = await common_user_wechat.findBy({
      user_id: user.user_id
    })

    if (wechat.length > 0) {
      returnData.wechat = []
      for (const w of wechat) {
        returnData.wechat.push({
          appid: w.user_wechat_appid,
          openid: w.user_wechat_openid,
          nickname: w.user_wechat_nickname,
          headimgurl: w.user_wechat_headimgurl
        })
      }
    }

    const organizations = await simpleSelect(
      `SELECT a.organization_user_default_flag, b.organization_id , b.organization_code , b.organization_name 
      FROM tbl_common_organization_user a , 
      tbl_common_organization b 
      WHERE a.organization_id = b.organization_id and b.organization_type = "01" 
      and a.user_id = ? order by organization_index`,
      [user.user_id]
    )

    returnData.default_organization = ''
    returnData.default_organization_code = ''
    returnData.default_organization_name = ''
    returnData.organizations = []
    for (const o of organizations) {
      if (o.organization_user_default_flag === '1') {
        returnData.default_organization = o.organization_id
        returnData.default_organization_code = o.organization_code
        returnData.default_organization_name = o.organization_name
      }
      returnData.organizations.push({
        id: o.organization_id,
        code: o.organization_code,
        name: o.organization_name
      })
    }

    const orgs: number[] = [0]
    if (returnData.default_organization) {
      orgs.push(returnData.default_organization)
    }

    const groups = await simpleSelect(
      `SELECT
      a.usergroup_id,
      b.usergroup_code 
    FROM
      tbl_common_user_groups a
      LEFT JOIN tbl_common_usergroup b ON a.usergroup_id = b.usergroup_id 
    WHERE
      a.user_id = ? 
      AND a.usergroup_id IN (
      SELECT
        usergroup_id 
      FROM
        tbl_common_usergroup 
      WHERE
      organization_id IN ( ? ) 
      )`,
      [user.user_id, orgs]
    )

    if (groups.length > 0) {
      const gids: number[] = []
      returnData.groups = []
      for (const g of groups) {
        gids.push(g.usergroup_id)
        returnData.groups.push(g.usergroup_code)
      }

      returnData.menulist = await iterationMenu(user, gids)

      // prepare redis Cache
      const authApis = []
      authApis.push({
        api_name: '用户设置',
        api_function: 'USERSETTING',
        auth_flag: '1'
      })
      if (user.user_type === GLBConfig.USER_TYPE.TYPE_ADMINISTRATOR) {
        if (user.user_username === 'admin') {
          authApis.push({
            api_name: '系统菜单维护',
            api_function: 'SYSTEMAPICONTROL'
          })

          authApis.push({
            api_name: '角色组维护',
            api_function: 'GROUPCONTROL'
          })

          authApis.push({
            api_name: '用户维护',
            api_function: 'OPERATORCONTROL'
          })

          authApis.push({
            api_name: '机构模板维护',
            api_function: 'ORGANIZATIONTEMPLATECONTROL'
          })

          authApis.push({
            api_name: '机构维护',
            api_function: 'ORGANIZATIONCONTROL'
          })

          authApis.push({
            api_name: '基础功能',
            api_function: 'BASECONTROL'
          })

          authApis.push({
            api_name: '重置密码',
            api_function: 'RESETPASSWORD'
          })
        } else {
          authApis.push({
            api_name: '机构组织维护',
            api_function: 'ORGANIZATIONGROUPCONTROL'
          })

          authApis.push({
            api_name: '机构用户维护',
            api_function: 'ORGANIZATIONUSERCONTROL'
          })

          authApis.push({
            api_name: '基础功能',
            api_function: 'BASECONTROL'
          })
        }
      } else {
        const groupapis = await queryGroupApi(gids)
        for (const item of groupapis) {
          authApis.push({
            api_name: item.api_name,
            api_function: item.api_function,
            auth_flag: item.auth_flag
          })
        }
      }
      returnData.authApis = authApis
      let expired = null
      if (type === 'MOBILE' || type === 'OA' || type === 'MP') {
        expired = config.get<number>('security.MOBILE_TOKEN_AGE')
      } else if (type === 'SYSTEM') {
        expired = config.get<number>('security.SYSTEM_TOKEN_AGE')
      } else {
        expired = config.get<number>('security.TOKEN_AGE')
      }
      const userData = _.omit(JSON.parse(JSON.stringify(user)), [
        'user_password'
      ])
      userData.groups = JSON.parse(JSON.stringify(returnData.groups))
      userData.wechat = JSON.parse(JSON.stringify(wechat))
      userData.default_organization = returnData.default_organization
      userData.default_organization_code = returnData.default_organization_code
      const loginKey = [GLBConfig.REDIS_KEYS.AUTH, type, user.user_id].join('_')
      await redisClient.del(loginKey)
      await redisClient.set(
        loginKey,
        {
          session_token: session_token,
          user: userData,
          authApis: authApis
        },
        'EX',
        expired
      )

      return returnData
    } else {
      return null
    }
  } catch (error) {
    logger.error(error)
    return null
  }
}

const queryGroupApi = async (groups: number[]) => {
  try {
    // prepare redis Cache
    const queryStr = `SELECT DISTINCT
        c.api_name ,
        c.api_function ,
        c.auth_flag
      FROM
        tbl_common_usergroupmenu a ,
        tbl_common_systemmenu b ,
        tbl_common_api c ,
        tbl_common_usergroup d
      WHERE
        a.menu_id = b.systemmenu_id
      AND b.api_id = c.api_id
      AND a.usergroup_id = d.usergroup_id
      AND d.organization_id = 0
      AND(c.api_type = '0' OR c.api_type = '2')
      AND c.api_function != ''
      AND a.usergroup_id IN(?)
      AND b.state = '1'
      UNION
        SELECT DISTINCT
          c.api_name ,
          c.api_function ,
          c.auth_flag
        FROM
          tbl_common_usergroupmenu a ,
          tbl_common_organizationmenu b ,
          tbl_common_api c ,
          tbl_common_usergroup d
        WHERE
          a.menu_id = b.organizationmenu_id
        AND b.api_id = c.api_id
        AND a.usergroup_id = d.usergroup_id
        AND d.organization_id != 0
        AND(c.api_type = '0' OR c.api_type = '2')
        AND c.api_function != ''
        AND a.usergroup_id IN(?)
        AND b.state = '1'`

    const replacements = [groups, groups]
    const groupmenus = await simpleSelect(queryStr, replacements)
    return groupmenus
  } catch (error) {
    logger.error(error)
    return []
  }
}

interface menuItem {
  menu_id?: number
  menu_type: string
  menu_name: string
  menu_path?: string
  menu_icon?: string
  show_flag?: string
  sub_menu?: menuItem[]
}
async function iterationMenu(
  user: common_user,
  groups: number[]
): Promise<menuItem[]> {
  if (user.user_type === GLBConfig.USER_TYPE.TYPE_ADMINISTRATOR) {
    const return_list = []
    return_list.push({
      menu_id: 0,
      menu_type: GLBConfig.NODE_TYPE.NODE_ROOT,
      menu_name: '权限管理',
      menu_icon: 'fa-cogs',
      sub_menu: []
    })
    if (user.user_username === 'admin') {
      return_list[0].sub_menu.push({
        menu_id: 1,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '系统菜单维护',
        menu_path: '/admin/auth/SystemApiControl'
      })

      return_list[0].sub_menu.push({
        menu_id: 2,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '角色组维护',
        menu_path: '/admin/auth/GroupControl'
      })

      return_list[0].sub_menu.push({
        menu_id: 3,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '用户维护',
        menu_path: '/admin/auth/OperatorControl'
      })

      return_list[0].sub_menu.push({
        menu_id: 4,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '机构模板维护',
        menu_path: '/admin/auth/OrganizationTemplateControl'
      })

      return_list[0].sub_menu.push({
        menu_id: 5,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '机构维护',
        menu_path: '/admin/auth/OrganizationControl'
      })

      return_list[0].sub_menu.push({
        menu_id: 6,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '重置密码',
        menu_path: '/admin/auth/ResetPassword'
      })
    } else {
      return_list[0].sub_menu.push({
        menu_id: 7,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '机构组织维护',
        menu_path: '/admin/auth/OrganizationGroupControl'
      })

      return_list[0].sub_menu.push({
        menu_id: 8,
        menu_type: GLBConfig.NODE_TYPE.NODE_LEAF,
        menu_name: '机构用户维护',
        menu_path: '/admin/auth/OrganizationUserControl'
      })
    }

    return return_list
  } else {
    const systemgroup = await simpleSelect(
      'select usergroup_id from tbl_common_usergroup where organization_id = 0',
      []
    )
    const sysgroup: number[] = []
    systemgroup.forEach((val: any) => {
      sysgroup.push(val.usergroup_id)
    })

    const mugroup = _.difference(groups, sysgroup) || []
    const sgroup = _.difference(groups, mugroup) || []

    let sysMenus: menuItem[] = [],
      menus: menuItem[] = []
    if (sgroup.length > 0) {
      sysMenus = await recursionSystemMenu(sgroup, '0')
    }
    if (mugroup.length > 0) {
      menus = await recursionMenu(mugroup, '0')
    }

    return _.concat(sysMenus, menus)
  }
}
async function recursionSystemMenu(
  groups: number[],
  parent_id: string | number
): Promise<menuItem[]> {
  const return_list: menuItem[] = []
  const queryStr = `SELECT DISTINCT
        b.systemmenu_id menu_id ,
        b.node_type ,
        b.systemmenu_name menu_name ,
        b.systemmenu_icon menu_icon ,
        c.api_path
      FROM
        tbl_common_usergroupmenu a ,
        tbl_common_systemmenu b
      LEFT JOIN tbl_common_api c ON b.api_id = c.api_id
      AND(c.api_type = '0' OR c.api_type = '1')
      AND api_path != ''
      WHERE
        a.menu_id = b.systemmenu_id
      AND a.usergroup_id IN(?)
      AND b.parent_id = ?`

  const replacements = [groups, parent_id]
  const menus = await simpleSelect(queryStr, replacements)

  for (const m of menus) {
    let sub_menu: menuItem[] = []

    if (m.node_type === GLBConfig.NODE_TYPE.NODE_ROOT) {
      sub_menu = await recursionSystemMenu(groups, m.menu_id)
    }

    if (m.node_type === GLBConfig.NODE_TYPE.NODE_LEAF && m.api_path) {
      return_list.push({
        menu_id: m.menu_id,
        menu_type: m.node_type,
        menu_name: m.menu_name,
        menu_path: m.api_path,
        menu_icon: m.menu_icon
      })
    } else if (
      m.node_type === GLBConfig.NODE_TYPE.NODE_ROOT &&
      sub_menu.length > 0
    ) {
      return_list.push({
        menu_id: m.menu_id,
        menu_type: m.node_type,
        menu_name: m.menu_name,
        menu_path: m.api_path,
        menu_icon: m.menu_icon,
        sub_menu: sub_menu
      })
    }
  }
  return return_list
}

async function recursionMenu(
  groups: number[],
  parent_id: string | number
): Promise<menuItem[]> {
  const return_list = []
  const queryStr = `SELECT DISTINCT
        b.organizationmenu_id menu_id ,
        b.node_type ,
        b.organizationmenu_name menu_name ,
        b.organizationmenu_icon menu_icon ,
        c.api_path
      FROM
        tbl_common_usergroupmenu a ,
        tbl_common_organizationmenu b
      LEFT JOIN tbl_common_api c ON b.api_id = c.api_id
      AND(c.api_type = '0' OR c.api_type = '1')
      AND api_path != ''
    WHERE
      a.menu_id = b.organizationmenu_id
    AND a.usergroup_id IN(?)
    AND b.parent_id = ?`

  const replacements = [groups, parent_id]
  const menus = await simpleSelect(queryStr, replacements)

  for (const m of menus) {
    let sub_menu: menuItem[] = []

    if (m.node_type === GLBConfig.NODE_TYPE.NODE_ROOT) {
      sub_menu = await recursionMenu(groups, m.menu_id)
    }

    if (m.node_type === GLBConfig.NODE_TYPE.NODE_LEAF && m.api_path) {
      return_list.push({
        menu_type: m.node_type,
        menu_name: m.menu_name,
        menu_path: m.api_path,
        menu_icon: m.menu_icon
      })
    } else if (
      m.node_type === GLBConfig.NODE_TYPE.NODE_ROOT &&
      sub_menu.length > 0
    ) {
      return_list.push({
        menu_type: m.node_type,
        menu_name: m.menu_name,
        menu_path: m.api_path,
        menu_icon: m.menu_icon,
        sub_menu: sub_menu
      })
    }
  }
  return return_list
}

export default {
  signinAct,
  captchaAct,
  loginSmsAct,
  signinBySmsAct,
  signinByAccountAct,
  signoutAct,
  userExistAct,
  registerSmsAct,
  registerAct,
  loginInit
}
