import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate
} from 'typeorm'

export class base_entity {
  @Column({ length: 5, default: '1', comment: '软删除表示 1--生效 0--失效' })
  state: string

  @Column({ default: 0, comment: '更新版本 更新一次+1' })
  version: number

  @UpdateDateColumn()
  updated_at: Date

  @CreateDateColumn()
  created_at: Date

  @BeforeUpdate()
  updateVersion() {
    this.version += 1
  }
}
