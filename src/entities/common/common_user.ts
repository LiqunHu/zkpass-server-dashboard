import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ValueTransformer,
  BaseEntity
} from 'typeorm'
import crypto from 'crypto'
import { base_entity } from '@/entities/base_entity'

const toMD5Hash: ValueTransformer = {
  from: (value: string) => value,
  to: (value: string) => crypto.createHash('sha256').update(value).digest("hex")
}

@Entity({ name: 'tbl_common_user' })
export class common_user extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '主键' })
  user_id: string

  @Column({ length: 100, comment: '用户名' })
  user_username: string

  @Column({ length: 10, comment: '用户类型' })
  user_type: string

  @Column({ length: 100, comment: 'Email' })
  user_email: string

  @Column({ length: 5, default: '86', comment: '国家代码' })
  user_country_code: string

  @Column({ length: 20, comment: '手机' })
  user_phone: string

  @Column({ length: 50, comment: 'discord' })
  user_discord: string

  @Column({ length: 100, comment: '区块链地址' })
  user_account: string

  @Column({ length: 100, transformer: toMD5Hash, comment: '密码' })
  user_password: string

  @Column({ default: 0, comment: '密码错误次数 -1未设置密码 0正常' })
  user_password_error: number

  @Column({ comment: '末次登陆时间' })
  user_login_time: Date

  @Column({ length: 100, default: '', comment: '姓名' })
  user_name: string

  @Column({ length: 1, default: '', comment: '性别' })
  user_gender: string

  @Column({ length: 200, default: '', comment: '头像' })
  user_avatar: string

  @Column({ length: 20, default: '', comment: '省' })
  user_province: string

  @Column({ length: 20, default: '', comment: '市/县' })
  user_city: string

  @Column({ length: 20, default: '', comment: '区' })
  user_district: string

  @Column({ length: 100, default: '', comment: '地址' })
  user_address: string

  @Column({ length: 20, default: '', comment: '邮编' })
  user_zipcode: string

  @Column({ length: 200, default: '', comment: '公司' })
  user_company: string

  @Column({ length: 200, default: '', comment: '备注' })
  user_remark: string

  @Column(() => base_entity, { prefix: '' })
  base: base_entity
}
