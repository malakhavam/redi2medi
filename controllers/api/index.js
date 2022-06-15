const router = require('express').Router();

const userRoutes = require('./User-routes');

router.use('/users', userRoutes);

module.exports = router;
