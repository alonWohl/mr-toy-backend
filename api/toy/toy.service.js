import { ObjectId } from 'mongodb'
import { loggerService } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const toyService = {
	query,
	getById,
	add,
	update,
	remove
}

async function query(filterBy = { txt: '' }) {
	try {
		const criteria = {}

		if (filterBy.txt) {
			criteria.name = { $regex: filterBy.txt, $options: 'i' }
		}

		if (filterBy.inStock !== null) {
			criteria.inStock = filterBy.inStock
		}
		if (filterBy.labels && filterBy.labels.length) {
			criteria.labels = { $in: filterBy.labels }
		}

		const sortOptions = {}
		if (filterBy.sortBy?.type) {
			const sortDirection = filterBy.sortBy.desc ? -1 : 1
			sortOptions[filterBy.sortBy.type] = sortDirection
		}

		const collection = await dbService.getCollection('toy')
		const toys = await collection.find(criteria).sort(sortOptions).toArray()

		return toys
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
