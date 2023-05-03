import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { checkIfSessionIdExists } from '../middlewares/check-if-session-id-exists'
import { knex } from '../configs/database'

export async function mealsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', checkIfSessionIdExists)

  app.get('/:userId/meals', async (request, reply) => {
    const listMealsParamsValidator = z.object({
      userId: z.string(),
    })

    const { userId } = listMealsParamsValidator.parse(request.params)

    const sessionId = request.cookies.sessionId

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send()
    }

    const meals = await knex('meals').where({
      registered_by: userId,
    })

    return reply.status(200).send(meals)
  })

  app.get('/:id', async (request, reply) => {
    const findMealParamsValidator = z.object({
      id: z.string(),
    })

    const { id } = findMealParamsValidator.parse(request.params)

    const sessionId = request.cookies.sessionId

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send()
    }

    const meal = await knex('meals')
      .where({
        id,
        registered_by: user.id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send()
    }

    return reply.status(200).send(meal)
  })

  app.post('/', async (request, reply) => {
    const registerMealBodySchemaValidator = z.object({
      name: z.string(),
      description: z.string(),
      madeAt: z.string(),
      isOnDietPlan: z.boolean(),
    })

    const { name, description, isOnDietPlan, madeAt } =
      registerMealBodySchemaValidator.parse(request.body)

    const sessionId = request.cookies.sessionId

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send()
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_on_the_diet_plan: isOnDietPlan,
      registered_at: madeAt,
      registered_by: user.id,
    })

    return reply.status(201).send()
  })

  app.put('/:id', async (request, reply) => {
    const updateMealParamsValidator = z.object({
      id: z.string(),
    })
    const updateMealBodySchemaValidator = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      madeAt: z.string().optional(),
      isOnDietPlan: z.boolean().optional(),
    })

    const { id } = updateMealParamsValidator.parse(request.params)
    const toUpdateFields = updateMealBodySchemaValidator.parse(request.body)

    const sessionId = request.cookies.sessionId

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send()
    }

    await knex('meals').update(toUpdateFields).where({
      id,
      registered_by: user.id,
    })

    return reply.status(204).send()
  })

  app.delete('/:id', async (request, reply) => {
    const deleteMealParamsValidator = z.object({
      id: z.string(),
    })

    const { id } = deleteMealParamsValidator.parse(request.params)

    const meal = await knex('meals')
      .where({
        id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send()
    }

    const sessionId = request.cookies.sessionId

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send()
    }

    await knex('meals')
      .where({
        id,
        registered_by: user.id,
      })
      .delete()

    return reply.status(204).send()
  })
}
