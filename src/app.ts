import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { appErrorHandler } from './globals/error-handler'
import { appRoutes } from './routes'

export const app = fastify()

app.register(cookie)
app.register(appRoutes)
app.setErrorHandler(appErrorHandler)
