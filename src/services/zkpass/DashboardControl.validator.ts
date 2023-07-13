import Joi from 'joi'

export default {
  name: 'DashboardControl Services',
  apiList: {
    getTaskList: {
      name: '查询委托任务',
      enname: 'DashboardControlgetTaskList',
      tags: ['BaseControl'],
      path: '/api/zkpass/dashboard/getTaskList',
      type: 'post',
      JoiSchema: {
        body: {
          sbt_task_country_code: Joi.string().empty('').max(10),
          sbt_task_category: Joi.string().empty('').max(20),
          search_text: Joi.string().empty('').max(50),
          limit: Joi.number().integer(),
          offset: Joi.number().integer()
        }
      }
    }
  }
}
