import { FastifyInstance } from 'fastify'
import { usersRoutes } from './user'
import { mealsRoutes } from './meals'

export async function appRoutes(app: FastifyInstance) {
  app.register(usersRoutes, {
    prefix: '/users',
  })
  app.register(mealsRoutes, {
    prefix: '/meals',
  })
}
