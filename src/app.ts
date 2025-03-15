import fastify from 'fastify'

import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastifyWebsocket from '@fastify/websocket'

import { ZodError } from 'zod'
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'

import { env } from './env'
import { Routes } from './http/routes/_routes'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'

export const app = fastify()

app.register(cors, {
  origin: '*',
  credentials: true,
})

app.register(fastifySwagger, {
  swagger: {
    consumes: ['application/json'],
    produces: ['application/json'],
    info: {
      title: 'foodbox.scala',
      description:
        'Especificação da API para o back-end da aplicação foodbox.scala constuída para Laticínio Scala.',
      version: '1.0.0.',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUI, {
  routePrefix: '/doc',
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyWebsocket)

app.register(fastifyCookie)

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
  sign: {
    expiresIn: '1d',
  },
})

app.register(Routes)

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.flatten().fieldErrors,
    })
  }

  // if (!request.cookies.Authorization) {
  //   return reply.status(401).send({
  //     message: 'Authorization token not found in cookie.',
  //   })
  // }

  if (env.NODE_ENV !== 'production') {
    console.error(error)
  } else {
    // TODO: Here we should log to an external tool like DataDog / NewRelic / Sentry
  }

  return reply.status(500).send({
    message: 'Internal server error.',
  })
})
