import express from 'express'
import { addToy, getToyById, getToys, removeToy, updateToy } from './toy.controller.js'
import { requireAdmin } from '../../middlewares/requireAuth.middleware.js'

export const toyRoutes = express.Router()

toyRoutes.get('/', getToys)
toyRoutes.get('/:toyId', getToyById)
toyRoutes.post('/', requireAdmin, addToy)
toyRoutes.put('/:toyId', requireAdmin, updateToy)
toyRoutes.delete('/:toyId', requireAdmin, removeToy)
