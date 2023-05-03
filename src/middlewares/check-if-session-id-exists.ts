import { FastifyRequest, FastifyReply } from 'fastify'

export async function checkIfSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId = request.cookies.sessionId

  if (!sessionId) {
    return reply.status(401).send({
      status: 'Unauthorized',
      message: "You're not authorized to do this action",
    })
  }
}
