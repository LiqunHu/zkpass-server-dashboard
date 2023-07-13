import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { base_entity } from '@/entities/base_entity'

@Entity({ name: 'tbl_sbt_submit_api' })
export class sbt_submit_api extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: '主键' })
  sbt_submit_api_id: number

  @Column({ length: 36, comment: '外键 tbl_common_user' })
  user_id: string

  @Column({ default: '', length: 10, comment: '国家' })
  sbt_submit_api_country_code: string

  @Column({ default: '', length: 20, comment: '任务类型' })
  sbt_submit_api_category: string

  @Column({ default: '', length: 500, comment: '网址' })
  sbt_submit_api_domain: string

  @Column({ default: '', length: 50, comment: 'discord' })
  sbt_submit_api_discord: string

  @Column({ default: '', length: 1000, comment: '描述' })
  sbt_submit_api_description: string

  @Column({ type: 'simple-array', comment: '图片' })
  sbt_submit_api_images: string

  @Column({ type: 'simple-json', comment: 'api内容' })
  sbt_submit_api_data: [
    {
      request: object
      response: object
    }
  ]

  @Column({ default: '0', length: 10, comment: '状态 0--提交' })
  sbt_submit_api_status: string

  @Column(() => base_entity, { prefix: '' })
  base: base_entity
}
