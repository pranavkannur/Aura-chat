const express = require('express');
const { register, login, getUsers, searchUsers } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', protect, getUsers);
router.get('/search', protect, searchUsers);

module.exports = router;
