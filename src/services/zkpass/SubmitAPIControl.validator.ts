import Joi from 'joi'

export default {
  name: 'SubmitAPIControl Services',
  apiList: {
    getSubmitAPIList: {
      name: '查询提交的api',
      enname: 'SubmitAPIControl',
      tags: ['BaseControl'],
      path: '/api/zkpass/SubmitAPIControl/getSubmitAPIList',
      type: 'post',
      JoiSchema: {
        body: {}
      }
    },
    upload: {
      name: '上传文件',
      enname: 'BaseControlupload',
      tags: ['BaseControl'],
      path: '/api/zkpass/SubmitAPIControl//upload',
      type: 'post',
      JoiSchema: {}
    },
    submitAPI: {
      name: '提交api',
      enname: 'BaseControlsubmitAPI',
      tags: ['BaseControl'],
      path: '/api/zkpass/SubmitAPIControl/submitAPI',
      type: 'post',
      JoiSchema: {
        body: {
          domain: Joi.string().max(100),
          category: Joi.string().max(20),
          country: Joi.string().max(10),
          describe: Joi.string().empty('').max(1000),
          discord: Joi.string().max(50),
          files: Joi.array().items(Joi.string()),
          requests: Joi.array().items(Joi.object())
        }
      }
    }
  }
}
