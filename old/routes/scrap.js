const express = require('express');
const _ = require('lodash');
const tripadvisor = require('../service/tripadvisor');

const router = express.Router();

const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const promises = [];
    _.range(1).forEach((value) => promises.push(tripadvisor.getInformation(value)));
    Promise.all(promises).then((value) => {
      console.log('getInformation - DONE');
      res.json(value);
    });
  })
);

router.get(
    '/post',
    asyncMiddleware(async (req, res) => {
        const urlPost = req.query.url;
        tripadvisor.getInformationPost(urlPost).then((value) => {
            console.log('getInformationPost - DONE');
            res.json(value);
        });
    })
);

module.exports = router;
