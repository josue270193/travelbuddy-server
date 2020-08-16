const express = require('express');
const scrapeIt = require('scrape-it');
const _ = require('lodash');

const router = express.Router();

const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const transformDataTripadvisor = (data, url) => {
  const result = _.assign({}, data);
  if (result) {
    result.url = url;
    if (result.topics) {
      result.topics = result.topics.filter((item) => item.temaLink);
    }
  }
  return result;
};

const getUrlTripadvisor = (numberPage) => {
  let urlTripadvisor = 'https://www.tripadvisor.com.ar/';
  const valuePage = numberPage * 20;
  const urlArgentinaInitial = 'ShowForum-g294266-i977-Argentina.html';
  const urlArgentinaPage = `ShowForum-g294266-i977-o${valuePage}-Argentina.html`;
  if (numberPage) {
    urlTripadvisor = urlTripadvisor.concat(urlArgentinaPage);
  } else {
    urlTripadvisor = urlTripadvisor.concat(urlArgentinaInitial);
  }
  return urlTripadvisor;
};

const getInformationTripadvisor = (numberPage) => {
  const url = getUrlTripadvisor(numberPage);
  return scrapeIt(url, {
    topics: {
      listItem: '#SHOW_FORUMS_TABLE > tr',
      data: {
        foro: 'td.forumcol',
        tema: 'td > b > a',
        temaLink: {
          selector: 'td > b > a',
          attr: 'href',
        },
      },
    },
    title: '#HEADING',
  }).then(({ data, response }) => {
    transformDataTripadvisor(data, url);
    console.log(`url: ${url} - status: ${response.statusCode}`);
    return data;
  });
};

router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const promises = [];
    _.range(1).forEach((value) =>
      promises.push(getInformationTripadvisor(value))
    );
    Promise.all(promises).then((value) => {
      console.log('DONE');
      res.json(value);
    });
  })
);

module.exports = router;
