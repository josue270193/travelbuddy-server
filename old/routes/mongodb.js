const express = require('express');
const mongo = require('../service/mongodb');

const router = express.Router();

router.get('/test', (req, res) => {
  res.json(mongo.testConnection());
});

module.exports = router;
