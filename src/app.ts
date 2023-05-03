import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { appErrorHandler } from './globals/error-handler'

export const app = fastify()

app.register(cookie)
app.setErrorHandler(appErrorHandler)
