import { loggerService } from '../../services/logger.service.js'
import { toyService } from '../toy/toy.service.js'
import { reviewService } from './review.service.js'

export async function getReviews(req, res) {
	try {
		const reviews = await reviewService.query(req.query)
		res.json(reviews)
	} catch (err) {
		loggerService.error('Cannot get reviews', err)
		res.status(400).send('Failed to get reviews')
	}
}

export async function removeReview(req, res) {
	try {
		const { loggedinUser } = req
		const { id: reviewId } = req.params

		const deletedCount = await reviewService.remove(reviewId)
		res.json({ message: `${deletedCount} reviews removed successfully` })
	} catch (err) {
		loggerService.error('Cannot remove review', err)
		res.status(400).send('Failed to remove review')
	}
}

export async function addReview(req, res) {
	try {
		const { loggedinUser } = req
		const review = req.body
		const { aboutToyId } = review

		review.byUserId = loggedinUser._id

		const savedReview = await reviewService.add(review)

		savedReview.byUser = loggedinUser
		savedReview.aboutToy = await toyService.getById(aboutToyId)

		delete savedReview.aboutToyId
		delete savedReview.byUserId

		res.json(savedReview)
	} catch (err) {
		loggerService.error('Cannot add review', err)
		res.status(400).send('Failed to add review')
	}
}
