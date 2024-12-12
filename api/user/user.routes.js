import express from 'express'
import { deleteUser, getUser, getUsers, updateUser } from './user.controller.js'
import { requireAdmin, requireAuth } from '../../middlewares/requireAuth.middleware.js'

export const userRoutes = express.Router()

userRoutes.get('/', getUsers)
userRoutes.get('/:id', getUser)
userRoutes.put('/:id', updateUser)
userRoutes.delete('/:id', requireAuth, requireAdmin, deleteUser)
