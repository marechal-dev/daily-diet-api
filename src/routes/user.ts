import { randomUUID } from 'node:crypto'

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { hash, compare } from 'bcryptjs'

import { knex } from '../configs/database'
import { checkIfSessionIdExists } from '../middlewares/check-if-session-id-exists'

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', async (request, reply) => {
    const registerUserBodySchema = z.object({
      name: z.string().nonempty(),
      email: z.string().email(),
      password: z.string().min(8),
    })

    const { name, email, password } = registerUserBodySchema.parse(request.body)

    const userWithSameEmailExists = await knex('users')
      .where({
        email,
      })
      .first()

    if (userWithSameEmailExists) {
      return reply.status(400).send({
        message: 'User already exists!',
      })
    }

    const passwordHash = await hash(password, 6)

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      password_hash: passwordHash,
    })

    return reply.status(201).send()
  })

  app.post('/authenticate', async (request, reply) => {
    const authenticateUserBodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })

    const { email, password } = authenticateUserBodySchema.parse(request.body)

    const user = await knex('users').where('email', email).first()

    if (!user) {
      return reply.status(400).send({
        message: 'Incorrect Email or Password',
      })
    }

    const passwordsMatch = await compare(password, user.password_hash)

    if (!passwordsMatch) {
      return reply.status(400).send({
        message: 'Incorrect Email or Password',
      })
    }

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      const SEVEN_DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24 * 7

      await knex('users')
        .update({
          session_id: sessionId,
        })
        .where({
          id: user.id,
        })

      reply.cookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: SEVEN_DAYS_IN_MILLISECONDS,
      })
    }

    return reply.status(201).send()
  })

  app
    .get('/:id/metrics', async (request, reply) => {
      const getUserMetricsParamsValidator = z.object({
        id: z.string(),
      })

      const { id } = getUserMetricsParamsValidator.parse(request.params)

      const meals = await knex('meals').where({
        registered_by: id,
      })

      const mealsOnDietByDayMap = new Map<string, number>()

      meals.forEach((meal) => {
        if (!mealsOnDietByDayMap.has(meal.registered_at)) {
          mealsOnDietByDayMap.set(meal.registered_at, 1)

          return
        }

        const previousValue = mealsOnDietByDayMap.get(meal.registered_at)

        mealsOnDietByDayMap.set(meal.registered_at, previousValue! + 1)
      })

      const bestSequenceOfMealsOnDiet = Math.max(
        ...Array.from(mealsOnDietByDayMap.values()),
      )

      const mealsMetrics = {
        totalNumberOfMeals: meals.length,
        totalNumberOfMealsOnDiet: meals.filter(
          (meal) => meal.is_on_the_diet_plan,
        ).length,
        totalNumberOfMealsOffDiet: meals.filter(
          (meal) => meal.is_on_the_diet_plan === false,
        ).length,
        bestSequenceOfMealsOnDiet,
      }

      return reply.status(200).send(mealsMetrics)
    })
    .addHook('preHandler', checkIfSessionIdExists)
}
