import express from 'express'
import { addMsg, addToy, getToyById, getToys, removeMsg, removeToy, updateToy } from './toy.controller.js'
import { requireAdmin, requireAuth } from '../../middlewares/requireAuth.middleware.js'

export const toyRoutes = express.Router()

toyRoutes.get('/', getToys)
toyRoutes.get('/:toyId', getToyById)
toyRoutes.post('/', requireAdmin, addToy)
toyRoutes.put('/:toyId', requireAdmin, updateToy)
toyRoutes.delete('/:toyId', requireAdmin, removeToy)

// MSG ///
toyRoutes.post('/:toyId/msg', requireAuth, addMsg)
toyRoutes.delete('/:toyId/msg/:msgId', requireAuth, removeMsg)
