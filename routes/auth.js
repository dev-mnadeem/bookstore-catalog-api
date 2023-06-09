'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const usersController = require('../controllers/users.controller');
const { localLogin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../schemas/user.schema');

const router = express.Router();

// Validate the shape first, then verify the credentials, then mint the token.
router.post('/login', validate(loginSchema), localLogin, asyncHandler(usersController.login));

module.exports = router;
