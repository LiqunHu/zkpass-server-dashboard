import Joi from 'joi'

export default {
  name: 'adminSubmitApi Services',
  apiList: {
    getSubmitAPIList: {
      name: '查询委托任务',
      enname: 'adminSubmitApigetSubmitAPIList',
      tags: ['adminSubmitApi'],
      path: '/api/zkpass/adminSubmitApi/getSubmitAPIList',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_task_country_code: Joi.string().empty('').max(10),
          sbt_task_category: Joi.string().empty('').max(20),
          search_text: Joi.string().empty('').max(50),
          limit: Joi.number().integer(),
          offset: Joi.number().integer()
        },
      },
    },
    modifySubmitAPI: {
      name: '修改API',
      enname: 'adminSubmitApimodifySubmitAPI',
      tags: ['adminSubmitApi'],
      path: '/api/zkpass/adminSubmitApi/modifySubmitAPI',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_submit_api_id: Joi.number().integer(),
          sbt_submit_api_status: Joi.string().max(10),
        },
      },
    },
    deleteSubmitAPI: {
      name: '删除委托任务',
      enname: 'adminSubmitApideleteSubmitAPI',
      tags: ['adminSubmitApi'],
      path: '/api/zkpass/adminSubmitApi/deleteSubmitAPI',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_submit_api_id: Joi.number().integer(),
        },
      },
    },
  },
}
