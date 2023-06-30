import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import config from 'config'
import { dataSource } from '@/app/db'

const table = 'src/entities/common/common_usergroupmenu.ts'
// let connection: Connection | null = null
export async function createDB() {
  if (table) {
    const dataSource = new DataSource({
      type: 'mysql',
      host: config.get<string>('mysql.host'),
      port: config.get<number>('mysql.port'),
      username: config.get<string>('mysql.username'),
      password: config.get<string>('mysql.password'),
      database: config.get<string>('mysql.database'),
      entities: [table],
      synchronize: true,
      logging: config.get<boolean>('mysql.logging'),
      namingStrategy: new SnakeNamingStrategy(),
    })
    await dataSource.initialize()
  }
}

(async () => {
  await createDB()
  process.exit(0)
})()
