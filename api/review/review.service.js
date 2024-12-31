import { ObjectId } from 'mongodb'
import { loggerService } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

export const reviewService = {
	query,
	add,
	remove
}
async function query(filterBy = {}) {
	try {
		const criteria = _buildCriteria(filterBy)
		const collection = await dbService.getCollection('review')
		let reviews = await collection
			.aggregate([
				{
					$match: criteria
				},
				{
					$lookup: {
						localField: 'byUserId',
						from: 'user',
						foreignField: '_id',
						as: 'user'
					}
				},
				{
					$unwind: '$user'
				},
				{
					$lookup: {
						localField: 'aboutToyId',
						from: 'toy',
						foreignField: '_id',
						as: 'toy'
					}
				},
				{
					$unwind: '$toy'
				},
				{
					$project: {
						_id: 1,
						txt: '$txt',
						aboutToy: {
							_id: '$toy._id',
							name: '$toy.name',
							price: '$toy.price'
						},
						byUser: {
							_id: '$user._id',
							fullname: '$user.fullname'
						}
					}
				}
			])
			.toArray()
		return reviews
	} catch (err) {
		loggerService.error('cannot get reviews', err)
		throw err
	}
}
async function remove(reviewId) {
	try {
		const { loggedinUser } = asyncLocalStorage.getStore()
		const collection = await dbService.getCollection('review')

		const criteria = { _id: ObjectId.createFromHexString(reviewId) }

		// remove only if user is owner/admin
		if (!loggedinUser.isAdmin) {
			criteria.byUserId = ObjectId.createFromHexString(loggedinUser._id)
		}

		const { deletedCount } = await collection.deleteOne(criteria)
		return deletedCount
	} catch (err) {
		logger.error(`cannot remove review ${reviewId}`, err)
		throw err
	}
}

async function add(review) {
	try {
		const reviewToAdd = {
			byUserId: ObjectId.createFromHexString(review.byUserId),
			aboutToyId: ObjectId.createFromHexString(review.aboutToyId),
			txt: review.txt
		}
		const collection = await dbService.getCollection('review')
		await collection.insertOne(reviewToAdd)

		return reviewToAdd
	} catch (err) {
		logger.error('cannot add review', err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	const criteria = {}

	if (filterBy.byUserId) {
		criteria.byUserId = ObjectId.createFromHexString(filterBy.byUserId)
	}

	if (filterBy.aboutToyId) {
		criteria.aboutToyId = ObjectId.createFromHexString(filterBy.aboutToyId)
	}
	return criteria
}
