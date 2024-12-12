import { loggerService } from '../../services/logger.service.js'
import { userService } from './user.service.js'

export async function getUsers(req, res) {
	try {
		const users = await userService.query()
		res.send(users)
	} catch (err) {
		loggerService.error('Cannot load users', err)
		res.status(400).send('Cannot load users')
	}
}

export async function getUser(req, res) {
	try {
		const { userId } = req.params
		const user = await userService.getById(userId)
		res.send(user)
	} catch (err) {
		loggerService.error('Cannot load user', err)
		res.status(400).send('Cannot load user')
	}
}

export async function deleteUser(req, res) {
	try {
		await userService.remove(req.params.id)
		res.send({ msg: 'Deleted successfully' })
	} catch (err) {
		loggerService.error('Failed to delete user')
		res.status(500).send({ err: 'Failed to delete user' })
	}
}

export async function updateUser(req, res) {
	try {
		const user = req.body
		const savedUser = await userService.update(user)
		res.send(savedUser)
	} catch (err) {
		loggerService.error('cannot update user', err)
		res.status(500).send({ err: 'Failed to update user' })
	}
}
