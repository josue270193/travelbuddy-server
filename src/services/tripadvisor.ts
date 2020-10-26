import {Inject, Service} from 'typedi';
import {EventDispatcher, EventDispatcherInterface} from '../decorators/eventDispatcher';
import config from '../config';
import scrapeIt from 'scrape-it';
import {format} from 'util';
import _ from 'lodash';
import * as fs from 'fs';
import path from 'path';
import {Logger} from 'winston';

@Service()
export default class TripadvisorService {
  constructor(
    @Inject('logger') private logger: Logger,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {
  }

  public async getInformation(numberPage: number): Promise<any> {
    const url = this.getUrlTripadvisor(numberPage);
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
    }).then(({data, response}) => {
      this.logger.debug(`url: ${url} - status: ${response.statusCode}`);
      return this.obtainInformationPost(data, url);
    });
  }

  public async getInformationPost(urlPost: string): Promise<any> {
    const url = TripadvisorService.getUrlTripadvisorPost(urlPost);
    return scrapeIt(url, {
      title: '#SHOW_TOPIC .firstPostBox .topTitleText',
      responses: {
        listItem: '#SHOW_TOPIC .post',
        data: {
          content: '.postcontent .postBody > p',
        },
      },
    }).then(({data, response}) => {
      this.logger.debug(`url: ${url} - status: ${response.statusCode}`);
      return data;
    });
  }

  public generateFileDataFromJson(jsonData: any): void {
    const ts = Date.now();
    const targetDir = 'out';
    const pathDir = path.join(__dirname, '..', '..', targetDir);
    fs.mkdirSync(pathDir, {recursive: true});
    const extractData = TripadvisorService.extractDataFromJson(jsonData);
    for (const [key, list] of extractData) {
      this.generateFileDataExtract(ts, targetDir, key, list);
    }
  }

  private generateFileDataExtract(ts: number, targetDir: string, key: string, list: any[]): void {
    const targetSubDir = 'extract';
    const targetFile = `${key}_${ts}.txt`;
    const pathDir = path.join(__dirname, '..', '..', targetDir, targetSubDir);
    fs.mkdirSync(pathDir, {recursive: true});
    const pathFile = path.join(__dirname, '..', '..', targetDir, targetSubDir, targetFile);

    const stream = fs.createWriteStream(pathFile);
    stream.once('open', () => {
      list.forEach((text) => stream.write(`${text}\n`));
      stream.end();
      console.log('Archivo creado en: ', pathFile);
    });
  }

  private static extractDataFromJson(jsonData): Map<string, any[]> {
    const mapData = new Map();
    for (const pageData of jsonData) {
      for (const postData of pageData) {
        const key = TripadvisorService.transformToSnakeCase(postData.foro);
        if (postData.detail && postData.detail.responses) {
          for (const responseData of postData.detail.responses) {
            mapData.set(key, [...(mapData.get(key) || []), responseData.content]);
          }
        }
      }
    }
    return mapData;
  }

  private obtainInformationPost(pageData: any, url: string) {
    const pageDataFilter = TripadvisorService.transformDataForum(pageData, url);
    const promises = [];
    if (pageDataFilter.topics) {
      pageDataFilter.topics.forEach((item) => promises.push(this.obtainInformationPostDetail(item)));
    }
    return Promise.all(promises).then((value) => {
      this.logger.debug(`obtainInformationPost - DONE`);
      return value;
    });
  }

  private obtainInformationPostDetail(postData: any) {
    const data = _.assign({}, postData);
    return this.getInformationPost(data.temaLink).then((value) => {
      data.detail = value;
      return data;
    });
  }

  private static transformDataForum(data: any, url: string) {
    const result = _.assign({}, data);
    if (result) {
      result.url = url;
      if (result.topics) {
        result.topics = result.topics.filter((item) => item.temaLink);
      }
    }
    return result;
  }

  private getUrlTripadvisor(numberPage: number) {
    const countryDefaultConfig = config.tripadvisor.countryDefault;
    const countryDefault = config.tripadvisor.countries.find((item) => item.name === countryDefaultConfig);
    if (numberPage) {
      const valuePage = numberPage * 20;
      const urlArgentinaPage = format(countryDefault.urlPage, valuePage);
      return `${config.tripadvisor.baseUrl}${urlArgentinaPage}`;
    }
    return `${config.tripadvisor.baseUrl}${countryDefault.urlIndex}`;
  }

  private static getUrlTripadvisorPost(urlPost: string) {
    return `${config.tripadvisor.baseUrl}${urlPost}`;
  }

  private static transformToSnakeCase(text: string) {
    return (
      text &&
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map((x) => x.toLowerCase())
        .join('_')
    );
  }
}
