const scrapeIt = require('scrape-it');
const _ = require('lodash');

const URL_TRIPADVISOR = 'https://www.tripadvisor.com.ar';

const transformDataForum = (data, url) => {
  const result = _.assign({}, data);
  if (result) {
    result.url = url;
    if (result.topics) {
      result.topics = result.topics.filter((item) => item.temaLink);
    }
  }
  return result;
};

const getUrlPost = (urlPost) => {
  return `${URL_TRIPADVISOR}${urlPost}`;
};

const getUrl = (numberPage) => {
  if (numberPage) {
    const valuePage = numberPage * 20;
    const urlArgentinaPage = `/ShowForum-g294266-i977-o${valuePage}-Argentina.html`;
    return `${URL_TRIPADVISOR}${urlArgentinaPage}`;
  }
  const urlArgentinaInitial = '/ShowForum-g294266-i977-Argentina.html';
  return `${URL_TRIPADVISOR}${urlArgentinaInitial}`;
};

const getScrapPost = (urlPost) => {
  const url = getUrlPost(urlPost);
  return scrapeIt(url, {
    title: '#SHOW_TOPIC .firstPostBox .topTitleText',
    responses: {
      listItem: '#SHOW_TOPIC .post',
      data: {
        content: '.postcontent .postBody > p',
      },
    },
  }).then(({ data, response }) => {
    console.log(`url: ${url} - status: ${response.statusCode}`);
    return data;
  });
};

const obtainInformationPostDetail = (postData) => {
  const data = _.assign({}, postData);
  return getScrapPost(data.temaLink).then((value) => {
    data.detail = value;
    return data;
  });
};

const obtainInformationPost = (pageData, url) => {
  const pageDataFilter = transformDataForum(pageData, url);
  const promises = [];
  if (pageDataFilter.topics) {
    pageDataFilter.topics.forEach((item) =>
      promises.push(obtainInformationPostDetail(item))
    );
  }
  return Promise.all(promises).then((value) => {
    console.log('obtainInformationPost - DONE');
    return value;
  });
};

const getScrap = (numberPage) => {
  const url = getUrl(numberPage);
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
    console.log(`url: ${url} - status: ${response.statusCode}`);
    return obtainInformationPost(data, url);
  });
};

module.exports = {
  getInformation: getScrap,
  getInformationPost: getScrapPost,
};
