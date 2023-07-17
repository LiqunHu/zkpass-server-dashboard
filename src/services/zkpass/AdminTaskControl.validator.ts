import Joi from 'joi'

export default {
  name: 'adminTask Services',
  apiList: {
    getTaskList: {
      name: '查询委托任务',
      enname: 'adminTaskgetTaskList',
      tags: ['adminTask'],
      path: '/api/zkpass/adminTask/getTaskList',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_task_country_code: Joi.string().empty('').max(10),
          sbt_task_category: Joi.string().empty('').max(20),
          sbt_task_status: Joi.string().max(10),
          search_text: Joi.string().empty('').max(50),
          limit: Joi.number().integer(),
          offset: Joi.number().integer()
        },
      },
    },
    addTask: {
      name: '增加委托任务',
      enname: 'adminTaskaddTask',
      tags: ['adminTask'],
      path: '/api/zkpass/adminTask/addTask',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_task_country_code: Joi.string().max(10),
          sbt_task_category: Joi.string().max(20),
          sbt_task_domain: Joi.string().max(500),
          sbt_task_requirements: Joi.string().max(1000),
          sbt_task_reward: Joi.string().max(500),
          sbt_task_status: Joi.string().max(10),
        },
      },
    },
    modifyTask: {
      name: '修改委托任务',
      enname: 'adminTaskmodifyTask',
      tags: ['adminTask'],
      path: '/api/zkpass/adminTask/modifyTask',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_task_id: Joi.number().integer(),
          sbt_task_country_code: Joi.string().max(10),
          sbt_task_category: Joi.string().max(20),
          sbt_task_domain: Joi.string().max(500),
          sbt_task_requirements: Joi.string().max(1000),
          sbt_task_reward: Joi.string().max(500),
          sbt_task_status: Joi.string().max(10),
        },
      },
    },
    deleteTask: {
      name: '删除委托任务',
      enname: 'adminTaskdeleteTask',
      tags: ['adminTask'],
      path: '/api/zkpass/adminTask/deleteTask',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_task_id: Joi.number().integer(),
        },
      },
    },
  },
}
