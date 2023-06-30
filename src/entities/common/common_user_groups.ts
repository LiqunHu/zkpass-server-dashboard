import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { base_entity } from '@/entities/base_entity'

@Entity({ name: 'tbl_common_user_groups' })
export class common_user_groups extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: '主键' })
  user_groups_id: number

  @Column({ length: 36, comment: '外键 tbl_common_user' })
  user_id: string

  @Column({ comment: '外键 tbl_common_usergroup' })
  usergroup_id: number

  @Column(() => base_entity, { prefix: '' })
  base: base_entity
}
