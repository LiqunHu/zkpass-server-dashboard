import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { common_entity } from '@/entities/common_entity'

@Entity({ name: 'tbl_sbt_task' })
export class sbt_task extends common_entity {
  @PrimaryGeneratedColumn({ comment: '主键' })
  sbt_task_id: number

  @Column({ default: '', length: 10, comment: '国家' })
  sbt_task_country_code: string

  @Column({ default: '', length: 20, comment: '任务类型' })
  sbt_task_type: string

  @Column({ default: '', length: 500, comment: '网址' })
  url: string

  @Column({ default: '', length: 1000, comment: '需求' })
  requirements: string

  @Column({ default: '', length: 500, comment: '奖励' })
  reward: string
}
