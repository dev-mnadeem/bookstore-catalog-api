'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const usersController = require('../controllers/users.controller');
const { validate } = require('../middleware/validate');
const { registerSchema } = require('../schemas/user.schema');

/**
 * Registration only.
 *
 * The original build exposed GET /api/users (every account, unpaginated) and
 * PUT/DELETE /api/users/:id behind nothing but "some valid JWT" — any signed-in
 * user could rewrite or delete any other account. Self-service now lives on
 * /api/me, where the id comes from the token rather than the URL.
 */
const router = express.Router();

router.post('/', validate(registerSchema), asyncHandler(usersController.register));

module.exports = router;
