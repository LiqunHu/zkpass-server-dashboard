import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { base_entity } from '@/entities/base_entity'

@Entity({ name: 'tbl_common_usergroupmenu' })
export class common_usergroupmenu extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: '主键' })
  usergroupmenu_id: number

  @Column({ comment: '外键 tbl_common_usergroup' })
  usergroup_id: number

  @Column({
    comment:
      '外键 tbl_common_systemmenu organization_id = 0, tbl_common_organizationmenu'
  })
  menu_id: number

  @Column(() => base_entity, { prefix: '' })
  base: base_entity
}
