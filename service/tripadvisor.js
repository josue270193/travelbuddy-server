const scrapeIt = require('scrape-it');
const _ = require('lodash');

const URL_TRIPADVISOR = 'https://www.tripadvisor.com.ar';

const transformData = (data, url) => {
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

const getInformationPostDetail = (urlPost) => {
  const url = getUrlPost(urlPost);
  return scrapeIt(url, {
    title: '.firstPostBox.topTitleText',
  }).then(({ data, response }) => {
    console.log(`url: ${url} - status: ${response.statusCode}`);
    return data;
  });
};

const getInformationPost = (pageData, url) => {
  const pageDataFilter = transformData(pageData, url);
  const promises = [];
  if (pageDataFilter.topics) {
    pageDataFilter.topics.forEach((item) =>
      promises.push(getInformationPostDetail(item.temaLink))
    );
  }
  return Promise.all(promises).then((value) => {
    console.log('getInformationPostDetail - DONE');
    console.log(value);
    return pageDataFilter;
  });
};

const getInformation = (numberPage) => {
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
    return getInformationPost(data, url);
  });
};

export default { getInformation };
