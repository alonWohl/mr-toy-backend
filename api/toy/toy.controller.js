import { loggerService } from '../../services/logger.service.js'
import { toyService } from './toy.service.js'

export async function getToys(req, res) {
	try {
		const sortBy = req.query.sortBy || {}

		const filterBy = {
			txt: req.query.txt || '',
			inStock: req.query.inStock || null,
			pageIdx: +req.query.pageIdx || undefined,
			labels: req.query.labels || [],
			sortBy: {
				type: sortBy.type || '',
				desc: +sortBy.desc || 1
			}
		}

		const toys = await toyService.query(filterBy)
		res.send(toys)
		return toys
	} catch (err) {
		loggerService.error('Cannot load toys', err)
		res.status(500).send('Cannot load toys')
	}
}

export async function getToyById(req, res) {
	try {
		const { toyId } = req.params
		const toy = await toyService.getById(toyId)

		res.send(toy)
	} catch (err) {
		loggerService.error('Cannot get toy', err)
		res.status(400).send('Cannot get toy')
	}
}

export async function addToy(req, res) {
	const { loggedinUser } = req
	try {
		const toy = {
			name: req.body.name,
			price: +req.body.price,
			inStock: req.body.inStock,
			labels: req.body.labels
		}
		toy.owner = loggedinUser

		const addedToy = await toyService.add(toy)
		res.send(addedToy)
	} catch (err) {
		loggerService.error('Cannot add toy', err)
		res.status(400).send('Cannot add toy')
	}
}

export async function updateToy(req, res) {
	const { loggedinUser } = req
	try {
		const toy = {
			_id: req.params.toyId,
			name: req.body.name,
			price: +req.body.price,
			inStock: +req.body.inStock,
			labels: req.body.labels
		}
		const updatedToy = await toyService.update(toy)
		res.send(updatedToy)
	} catch (err) {
		loggerService.error('Cannot save toy', err)
		res.status(400).send('Cannot save toy')
	}
}

export async function removeToy(req, res) {
	const { loggedinUser } = req

	try {
		const { toyId } = req.params
		const deletedCount = await toyService.remove(toyId)
		res.send(`${deletedCount} toys removed`)
	} catch (err) {
		loggerService.error('Cannot remove toy', err)
		res.status(400).send('Cannot remove toy')
	}
}
