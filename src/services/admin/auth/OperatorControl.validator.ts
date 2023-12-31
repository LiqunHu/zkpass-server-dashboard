import Joi from 'joi'

export default {
  name: 'OperatorControl Services',
  apiList: {
    init: {
      name: '获取组相关信息',
      enname: 'OperatorControlinit',
      tags: ['OperatorControl'],
      path: '/api/system/auth/OperatorControl/init',
      type: 'post',
      JoiSchema: {}
    },
    search: {
      name: '用户查询',
      enname: 'OperatorControlsearch',
      tags: ['OperatorControl'],
      path: '/api/system/auth/OperatorControl/search',
      type: 'post',
      JoiSchema: {
        body: {
          search_text: Joi.string().empty('').max(50),
          limit: Joi.number().integer(),
          offset: Joi.number().integer()
        }
      }
    },
    add: {
      name: '增加操作员',
      enname: 'OperatorControladd',
      tags: ['OperatorControl'],
      path: '/api/system/auth/OperatorControl/add',
      type: 'post',
      JoiSchema: {
        body: {
          user_username: Joi.string().max(50),
          user_email: Joi.string().empty('').max(50),
          user_phone: Joi.string().empty('').max(50),
          user_name: Joi.string().empty('').max(50),
          user_gender: Joi.string().max(2),
          user_address: Joi.string().empty('').max(100),
          user_zipcode: Joi.string().empty('').max(10),
          user_groups: Joi.array().items(Joi.number().integer())
        }
      }
    },
    modify: {
      name: '修改用户',
      enname: 'OperatorControlmodify',
      tags: ['OperatorControl'],
      path: '/api/system/auth/OperatorControl/modify',
      type: 'post',
      JoiSchema: {
        body: {
          user_id: Joi.string().max(36).required(),
          user_username: Joi.string().max(100),
          user_email: Joi.string().empty('').max(100),
          user_country_code: Joi.string().max(5),
          user_phone: Joi.string().empty('').max(20),
          user_name: Joi.string().empty('').max(100),
          user_gender: Joi.string().empty('').max(1),
          user_avatar: Joi.string().empty('').max(200),
          user_province: Joi.string().empty('').max(20),
          user_city: Joi.string().empty('').max(20),
          user_district: Joi.string().empty('').max(20),
          user_address: Joi.string().empty('').max(100),
          user_zipcode: Joi.string().empty('').max(20),
          user_company: Joi.string().empty('').max(200),
          user_remark: Joi.string().empty('').max(200),
          user_groups: Joi.array().items(Joi.number().integer())
        }
      }
    },
    delete: {
      name: '删除用户',
      enname: 'OperatorControldelete',
      tags: ['OperatorControl'],
      path: '/api/system/auth/OperatorControl/delete',
      type: 'post',
      JoiSchema: {
        body: {
          user_id: Joi.string().max(50).required()
        }
      }
    }
  }
}
