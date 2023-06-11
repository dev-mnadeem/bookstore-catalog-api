'use strict';

const express = require('express');

const authRoutes = require('./auth');
const bookRoutes = require('./books');
const meRoutes = require('./me');
const userRoutes = require('./users');

const router = express.Router();

router.get('/health', (req, res) => res.respond(200, { data: { status: 'ok' } }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/me', meRoutes);

module.exports = router;
