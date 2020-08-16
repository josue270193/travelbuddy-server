const express = require('express');
const _ = require('lodash');
const { getInformation } = require('../service/tripadvisor')

const router = express.Router();

const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const promises = [];
    _.range(1).forEach((value) => promises.push(getInformation(value)));
    Promise.all(promises).then((value) => {
      console.log('getInformation - DONE');
      res.json(value);
    });
  })
);

module.exports = router;
