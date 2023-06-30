import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { base_entity } from '@/entities/base_entity'

@Entity({ name: 'tbl_common_organizationtemplate' })
export class common_organizationtemplate {
  @PrimaryGeneratedColumn({ comment: '主键' })
  organizationtemplate_id: number

  @Column({ length: 50, comment: '模板名称' })
  organizationtemplate_name: string

  @Column(() => base_entity , { prefix: '' })
  base: base_entity
}
