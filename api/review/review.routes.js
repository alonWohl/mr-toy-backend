import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { addReview, getReviews, removeReview } from './review.controller.js'

export const reviewRoutes = express.Router()

reviewRoutes.get('/', getReviews)
reviewRoutes.post('/', requireAuth, addReview)
reviewRoutes.delete('/:id', requireAuth, removeReview)
