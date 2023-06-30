import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'
import { base_entity } from '@/entities/base_entity'

@Entity({ name: 'tbl_common_templatemenu' })
export class common_templatemenu extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: '主键' })
  templatemenu_id: number

  @Column({ nullable: true, comment: '机构模板ID' })
  organizationtemplate_id: number

  @Column({ length: 300, comment: '模板菜单名称' })
  templatemenu_name: string

  @Column({ default: '', length: 100, comment: '模板菜单图标' })
  templatemenu_icon: string

  @Column({ default: 0, comment: '模板菜单排序' })
  templatemenu_index: number

  @Column({ nullable: true, comment: '外键 tbl_common_api' })
  api_id: number

  @Column({ nullable: true, length: 2, comment: '节点类型 NODETYPEINFO' })
  node_type: string

  @Column({ default: '', length: 30, comment: '父节点id 0为根节点' })
  parent_id: string

  @Column(() => base_entity, { prefix: '' })
  base: base_entity
}
