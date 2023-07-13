import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { base_entity } from '@/entities/base_entity'

@Entity({ name: 'tbl_sbt_task' })
export class sbt_task extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: '主键' })
  sbt_task_id: number

  @Column({ default: '', length: 10, comment: '国家' })
  sbt_task_country_code: string

  @Column({ default: '', length: 20, comment: '任务类型' })
  sbt_task_category: string

  @Column({ default: '', length: 500, comment: '网址' })
  sbt_task_domain: string

  @Column({ default: '', length: 1000, comment: '需求' })
  sbt_task_requirements: string

  @Column({ default: '', length: 500, comment: '奖励' })
  sbt_task_reward: string

  @Column({ default: '0', length: 10, comment: '状态 0--下架 1--上架' })
  sbt_task_status: string

  @Column(() => base_entity, { prefix: '' })
  base: base_entity
}
