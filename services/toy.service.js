import fs from 'fs'
import { utilService } from './util.service.js'

const PAGE_SIZE = 5
const toys = utilService.readJsonFile('data/toy.json')

export const toyService = {
	query,
	getById,
	remove,
	save
}

function query(filterBy = {}) {
	let filteredToys = toys
	if (filterBy.txt) {
		const regExp = new RegExp(filterBy.txt, 'i')
		filteredToys = filteredToys.filter(toy => regExp.test(toy.name))
	}
	if (filterBy.inStock) {
		filteredToys = filteredToys.filter(toy => toy.inStock === JSON.parse(filterBy.inStock))
	}
	if (filterBy.labels && filterBy.labels.length) {
		filteredToys = filteredToys.filter(toy => filterBy.labels.some(label => toy.labels.includes(label)))
	}

	const { sortBy } = filterBy
	if (sortBy.type) {
		filteredToys.sort((t1, t2) => {
			const sortDirection = +sortBy.desc
			if (sortBy.type === 'name') {
				return t1.name.localeCompare(t2.name) * sortDirection
			} else if (sortBy.type === 'price' || sortBy.type === 'createdAt') {
				return (t1[sortBy.type] - t2[sortBy.type]) * sortDirection
			}
		})
	}

	const chartsData = {
		pricesByLabel: _getAveragePricesByLabel(toys),
		inventoryByLabel: _getInventoryByLabel(toys),
		monthlySales: _generateMonthlySalesData()
	}

	const total = filteredToys.length

	if (filterBy.pageIdx !== undefined) {
		let startIdx = +filterBy.pageIdx * PAGE_SIZE
		filteredToys = filteredToys.slice(startIdx, startIdx + PAGE_SIZE)
	}

	return Promise.resolve({ toys: filteredToys, chartsData, total })
}

function getById(toyId) {
	let toy = toys.find(toy => toy._id === toyId)
	if (!toy) return Promise.reject('Toy not found')
	toy = _setNextPrevToyId(toy)
	return Promise.resolve(toy)
}

function remove(toyId) {
	const idx = toys.findIndex(toy => toy._id === toyId)
	if (idx === -1) return Promise.reject('No such toy')
	toys.splice(idx, 1)
	return _saveToysToFile()
}

function save(toy) {
	if (toy._id) {
		const idx = toys.findIndex(currToy => currToy._id === toy._id)
		toys[idx] = { ...toys[idx], ...toy }
	} else {
		toy._id = _makeId()
		toy.createdAt = Date.now()
		toy.inStock = true
		toys.unshift(toy)
	}
	return _saveToysToFile().then(() => toy)
}

function _makeId(length = 5) {
	let text = ''
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

function _saveToysToFile() {
	return new Promise((resolve, reject) => {
		const toysStr = JSON.stringify(toys, null, 4)
		fs.writeFile('data/toy.json', toysStr, err => {
			if (err) {
				return console.log(err)
			}
			resolve()
		})
	})
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

function _setNextPrevToyId(toy) {
	if (!toys.length) return toy

	const toyIdx = toys.findIndex(currToy => currToy._id === toy._id)
	const nextToy = toys[toyIdx + 1] ? toys[toyIdx + 1] : toys[0]
	const prevToy = toys[toyIdx - 1] ? toys[toyIdx - 1] : toys[toys.length - 1]

	toy.nextToyId = nextToy._id
	toy.prevToyId = prevToy._id
	return toy
}
