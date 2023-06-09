'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const usersController = require('../controllers/users.controller');
const { validate } = require('../middleware/validate');
const { registerSchema } = require('../schemas/user.schema');

/**
 * Registration only.
 *
 * There is deliberately no list, update or delete by id here: self-service
 * lives on /api/me, where the id comes from the token rather than the URL, so
 * no signed-in user can name another account.
 */
const router = express.Router();

router.post('/', validate(registerSchema), asyncHandler(usersController.register));

module.exports = router;
