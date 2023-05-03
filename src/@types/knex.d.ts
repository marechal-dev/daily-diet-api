// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  interface User {
    id: string
    name: string
    email: string
    password_hash: string
    created_at: string
    session_id?: string
  }

  interface Meal {
    id: string
    name: string
    description: string
    is_on_the_diet_plan: boolean
    registered_at: string
    registered_by: string
  }

  export interface Tables {
    meals: Meal
    users: User
  }
}
