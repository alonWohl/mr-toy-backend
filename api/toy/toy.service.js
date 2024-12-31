import { ObjectId } from 'mongodb'
import { loggerService } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'
import { reviewService } from '../review/review.service.js'

const PAGE_SIZE = 6

export const toyService = {
	query,
	getById,
	add,
	update,
	remove,
	addMsg,
	removeMsg
}

async function query(filterBy = { txt: '' }) {
	try {
		const criteria = _buildCriteria(filterBy)

		const sortOptions = {}

		if (filterBy.sortBy?.type) {
			const sortDirection = filterBy.sortBy.desc
			sortOptions[filterBy.sortBy.type] = sortDirection
		}

		const collection = await dbService.getCollection('toy')
		const total = await collection.countDocuments(criteria)
		const skipAmount = filterBy.pageIdx !== undefined ? filterBy.pageIdx * PAGE_SIZE : 0

		await collection.updateMany({}, [
			{
				$set: {
					createdAt: { $toDate: '$_id' }
				}
			}
		])

		const toys = await collection.find(criteria).sort(sortOptions).skip(skipAmount).limit(PAGE_SIZE).toArray()
		const chartsData = {
			pricesByLabel: _getAveragePricesByLabel(toys),
			inventoryByLabel: _getInventoryByLabel(toys),
			monthlySales: _generateMonthlySalesData()
		}

		return { toys, chartsData, total }
	} catch (err) {
		loggerService.error('Failed to query toys:', err)
		throw err
	}
}

async function getById(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const toy = await collection.findOne({ _id: ObjectId.createFromHexString(toyId) })
		toy.createdAt = toy._id.getTimestamp()

		toy.givenReviews = await reviewService.query({ aboutToyId: toyId })
		toy.givenReviews = toy.givenReviews.map(review => {
			delete review.aboutToy
			return review
		})
		return toy
	} catch (err) {
		loggerService.error('cannot find toy')
		throw err
	}
}

async function remove(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const { deletedCount } = collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
		return deletedCount
	} catch (err) {
		loggerService.error(`while finding ${toyId} `, err)
		throw err
	}
}

async function add(toy) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.insertOne(toy)
	} catch (err) {
		loggerService.error('cannot insert toy', err)
		throw err
	}
}

async function update(toy) {
	try {
		const toyToSave = {
			name: toy.name,
			price: toy.price,
			inStock: toy.inStock,
			labels: toy.labels
		}

		const collection = await dbService.getCollection('toy')
		collection.updateOne({ _id: ObjectId.createFromHexString(toy._id) }, { $set: toyToSave })
	} catch (err) {
		loggerService.error(`cannot update toy ${toy._id}`, err)
		throw err
	}
}

async function addMsg(toyId, msg) {
	try {
		msg.id = _makeId()
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
		return msg
	} catch (err) {
		loggerService.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}

async function removeMsg(toyId, msgId) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId } } })
		return msgId
	} catch (err) {
		loggerService.error(`cannot remove msg ${toyId}`, err)
		throw err
	}
}

function _getAveragePricesByLabel(toys) {
	const labelTotals = {}
	const labelCounts = {}

	toys.forEach(toy => {
		toy.labels.forEach(label => {
			if (!labelTotals[label]) {
				labelTotals[label] = 0
				labelCounts[label] = 0
			}
			labelTotals[label] += toy.price
			labelCounts[label]++
		})
	})

	const labels = Object.keys(labelTotals)
	const data = labels.map(label => Math.round(labelTotals[label] / labelCounts[label]))

	return { labels, data }
}

function _getInventoryByLabel(toys) {
	const labelStats = {}

	toys.forEach(toy => {
		toy.labels.forEach(label => {
			if (!labelStats[label]) {
				labelStats[label] = { total: 0, inStock: 0 }
			}
			labelStats[label].total++
			if (toy.inStock) labelStats[label].inStock++
		})
	})

	const labels = Object.keys(labelStats)
	const data = labels.map(label => Math.round((labelStats[label].inStock / labelStats[label].total) * 100))

	return { labels, data }
}

function _generateMonthlySalesData() {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const labels = months.slice(0, 6)
	const data = labels.map(() => Math.floor(Math.random() * 50) + 30)

	return { labels, data }
}

function _buildCriteria(filterBy) {
	const criteria = {}

	if (filterBy.txt) {
		criteria.name = { $regex: filterBy.txt, $options: 'i' }
	}

	if (filterBy.maxPrice) {
		criteria.price = { $lte: filterBy.maxPrice }
	}

	if (filterBy.inStock !== null) {
		criteria.inStock = JSON.parse(filterBy.inStock)
	}
	if (filterBy.labels && filterBy.labels.length) {
		criteria.labels = { $in: filterBy.labels }
	}

	return criteria
}

function _makeId(length = 6) {
	var txt = ''
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (var i = 0; i < length; i++) {
		txt += possible.charAt(Math.floor(Math.random() * possible.length))
	}

	return txt
}
