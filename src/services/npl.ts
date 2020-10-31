import {Inject, Service} from 'typedi';
import {EventDispatcher, EventDispatcherInterface} from '../decorators/eventDispatcher';
import {TextAnalyticsClient} from '@azure/ai-text-analytics';
import {Options, PythonShell} from 'python-shell';
import fileUpload from 'express-fileupload';
import readline from 'readline';
import fs from 'fs';
import fetch from 'node-fetch';
import mapLimit from 'async/mapLimit';
import CityModel from '../models/city';
import ConfigurationModel from '../models/configuration';
import {ICityDetail, ICountryDetail} from '../interfaces/ICity';
import WBK from 'wikibase-sdk';
import {IConfigurationValue, IConfigurationValueExtra} from '../interfaces/IConfiguration';
import emoji from 'node-emoji';
import {IDataCityDto} from '../interfaces/dto/IDataCityDto';
import config from '../config';

type UploadedFile = fileUpload.UploadedFile;

@Service()
export default class NplService {
  constructor(
    @Inject('logger') private logger,
    @Inject('cityModel') private cityModel: typeof CityModel,
    @Inject('configurationModel') private configurationModel: typeof ConfigurationModel,
    @Inject('clientAzure') private clientAzure: TextAnalyticsClient,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async processFile(country: string, city: string, file: UploadedFile): Promise<any> {
    const rl = readline.createInterface({
      input: fs.createReadStream(file.tempFilePath),
      output: process.stdout,
      terminal: false,
    });
    return await this.processFileLines(country, city, rl);
  }

  public async processText(text: string): Promise<any> {
    this.logger.debug(`Procesando el texto: ${text}`);
    return await this.executePython(text, true);
  }

  private async processFileLines(country: string, city: string, rl: readline.Interface): Promise<any> {
    const results = [];
    const max_process = config.api.maxProcessPython;
    try {
      for await (const line of rl) {
        results.push(line);
      }
    } catch (err) {
      this.logger.error('🔥 error: %o', err);
    }
    return mapLimit(results, max_process, async (text) => {
      return await this.processText(text);
    })
      .then(async (data) => {
        const countryData = await this.obtainInformationCountry(country);
        const cityData = await this.obtainInformationCity(city, country);
        return {
          country: countryData,
          city: cityData,
          comments: data,
        } as IDataCityDto;
      })
      .then((data) => {
        return this.simplifyData(data);
      })
      .then((data) => {
        return this.updateCityDB(data);
      });
  }

  private async obtainInformationCity(city: string, country: string): Promise<ICityDetail> {
    const configCity = await this.obtainConfiguration('mapPropertiesWikiCity');
    const cityDetail: ICityDetail = {
      name: city,
      wiki: null,
    };
    const wikiData = this.obtainWikiDataConfig();
    const urlSearch = wikiData.searchEntities({
      search: city,
      language: 'es',
      uselang: 'es',
      limit: 5,
    });
    return fetch(urlSearch)
      .then((data) => data.json())
      .then((data) => {
        if (data.search) {
          let search = data.search.find((item) => {
            let result = false;
            if (item.description) {
              const description = item.description.toLowerCase();
              const keywords = ['capital', 'ciudad'];
              if (keywords.some((keyword) => description.includes(keyword))) {
                result = description.includes(country);
              }
            }
            return result;
          });
          if (!search) {
            search = data.search.find((item) => {
              let result = false;
              if (item.description) {
                const description = item.description.toLowerCase();
                const keywords = ['capital', 'ciudad'];
                if (keywords.some((keyword) => description.includes(keyword))) {
                  result = true;
                }
              }
              return result;
            });
          }
          if (!search) {
            search = data.search.find((item) => {
              let result = false;
              if (item.description) {
                result = item.description.toLowerCase().includes(country);
              }
              return result;
            });
          }
          return search;
        }
      })
      .then((countryFound) => {
        if (countryFound) {
          return this.obtainInformationEntity(countryFound.id, configCity.value);
        }
      })
      .then((data) => {
        cityDetail.wiki = data;
        return cityDetail;
      })
      .catch((reason) => {
        this.logger.error('🔥 error: %o', reason);
        return cityDetail;
      });
  }

  private async obtainInformationCountry(country: string): Promise<ICountryDetail> {
    const configCountry = await this.obtainConfiguration('mapPropertiesWikiCountry');
    const countryDetail: ICountryDetail = {
      name: country,
      wiki: null,
    };
    const wikiData = this.obtainWikiDataConfig();
    const urlSearch = wikiData.searchEntities({
      search: country,
      language: 'es',
      uselang: 'es',
      limit: 1,
    });
    return fetch(urlSearch)
      .then((data) => data.json())
      .then((data) => {
        if (data.search) {
          return data.search.shift();
        }
      })
      .then((countryFound) => {
        if (countryFound) {
          return this.obtainInformationEntity(countryFound.id, configCountry.value);
        }
      })
      .then((data) => {
        countryDetail.wiki = data;
        return countryDetail;
      })
      .catch((reason) => {
        this.logger.error('🔥 error: %o', reason);
        return countryDetail;
      });
  }

  private async obtainInformationEntity(id: string, configWiki: IConfigurationValue[]): Promise<any> {
    const wikiData = this.obtainWikiDataConfig();
    const urlSearch = wikiData.getEntities({
      ids: [id],
      props: ['info', 'claims', 'descriptions', 'aliases', 'labels'],
      languages: ['es'],
      redirections: false,
    });
    return fetch(urlSearch)
      .then((data) => data.json())
      .then((data) => {
        if (data.entities && data.entities[id]) {
          return data.entities[id];
        }
      })
      .then((data) => this.parseEntity(data, configWiki))
      .catch((reason) => {
        this.logger.error('🔥 error: %o', reason);
        return null;
      });
  }

  private async executePython(text: string, isResultJson: boolean): Promise<any> {
    const options = {
      mode: 'text',
      pythonPath: '/home/josue/PycharmProjects/travelbuddy-npl/venv/bin/python',
      pythonOptions: ['-u'],
      scriptPath: '/home/josue/PycharmProjects/travelbuddy-npl',
      args: [`-t${text}`],
    } as Options;
    const filePython = 'main.py';
    const logger = this.logger;
    return new Promise((resolve, reject) => {
      let result;
      const pyshell = new PythonShell(filePython, options);

      pyshell.on('message', function (message) {
        result = isResultJson ? JSON.parse(message) : message;
      });

      pyshell.on('stderr', function (stderr) {
        logger.debug(`Python 🐍: ${stderr}`);
      });

      pyshell.end(function (err, code, signal) {
        if (err) {
          reject(err);
        }
        logger.debug(`Python 🐍 exit code: ${code}`);
        logger.debug('Python 🐍 finished');
        resolve(result);
      });
    });
  }

  private async obtainConfiguration(name: string): Promise<any> {
    return this.configurationModel.findOne({ name: name });
  }

  private parseEntity(data: any, configWiki: IConfigurationValue[]) {
    let result;
    if (data) {
      result = {
        alias: WBK.simplify.aliases(data.aliases),
        labels: WBK.simplify.labels(data.labels),
        descriptions: WBK.simplify.descriptions(data.descriptions),
      };
      configWiki.forEach(async (config) => {
        const property = this.getMultiLevelProp(data, `claims.${config.id}`);
        this.logger.debug(`property(${config.name})`);
        if (property) {
          let value = null;
          if (config.condition) {
            switch (config.condition.operator) {
              case 'group':
                property.forEach((item) => {
                  value = [];
                  let valueProp = this.getMultiLevelProp(item, config.condition.field);
                  switch (config.condition.type) {
                    case 'image':
                      valueProp = WBK.getImageUrl(valueProp, 250);
                      break;
                    default:
                  }
                  value.push(valueProp);
                });
                break;
              case 'first':
                const aux = [];
                property.forEach((item) => {
                  const auxItem = {};
                  config.extra.forEach((itemExtra) => {
                    let valuePropAux = this.getMultiLevelProp(item, itemExtra.value);
                    if (valuePropAux) {
                      switch (itemExtra.type) {
                        case 'date':
                          valuePropAux = WBK.wikibaseTimeToISOString(valuePropAux);
                          valuePropAux = new Date(valuePropAux);
                          break;
                        case 'number':
                          valuePropAux = valuePropAux.replace('+', '');
                          break;
                        default:
                      }
                      auxItem[itemExtra.name] = valuePropAux;
                    }
                  });
                  aux.push(auxItem);
                });
                aux.sort((a, b) => {
                  switch (config.condition.type) {
                    case 'date':
                      if (!a[config.condition.field]) return 1;
                      if (!b[config.condition.field]) return -1;
                      if (a === b) return 0;
                      return b[config.condition.field] - a[config.condition.field];
                    default:
                      return a[config.condition.field].localeCompare(b[config.condition.field]);
                  }
                });
                value = aux.shift();
                break;
              case 'eq':
                let valueAux = property.find((item) => {
                  const valueProp = this.getMultiLevelProp(item, config.condition.field);
                  return config.condition.value.localeCompare(valueProp) === 0;
                });
                valueAux = this.getMultiLevelProp(valueAux, config.value);
                if (config.value_entity) {
                  value = {};
                  value[config.value_entity] = valueAux;
                } else {
                  value = valueAux;
                }
                break;
              default:
            }
          }
          if (config.is_value_entity) {
            if (value) {
              value['value'] = await this.obtainWikiInformationByProps(
                [value[config.value_entity]],
                config.value_entity_extra,
              );
            } else {
              const valueProp = [];
              property.forEach((item) => {
                valueProp.push(this.getMultiLevelProp(item, config.value));
              });
              value = await this.obtainWikiInformationByProps(valueProp);
            }
          }
          if (config.value && !value) {
            const valueProp = [];
            property.forEach((item) => {
              valueProp.push(this.getMultiLevelProp(item, config.value));
            });
            value = valueProp;
          }
          if (config.extra && !value) {
            const valueProp = [];
            property.forEach((item) => {
              const valuePropAux = {};
              config.extra.forEach((itemExtra) => {
                valuePropAux[itemExtra.name] = this.getMultiLevelProp(item, itemExtra.value);
              });
              valueProp.push(valuePropAux);
            });
            value = valueProp;
          }
          result[config.name] = {
            description: config.description,
            value: value,
          };
        }
      });
      return result;
    }
  }

  private async obtainWikiInformationByProps(ids: string[], extras: IConfigurationValueExtra[] = []): Promise<any> {
    const wikiData = this.obtainWikiDataConfig();
    const urlSearch = wikiData.getEntities({
      ids: ids,
      props: ['labels', 'claims'],
      languages: ['es'],
      redirections: false,
    });
    return fetch(urlSearch)
      .then((data) => data.json())
      .then((data) => {
        const result = [];
        if (data.entities) {
          for (const key in data.entities) {
            if (data.entities.hasOwnProperty(key)) {
              const { labels, claims, id } = data.entities[key];
              result.push({
                id: id,
                value: WBK.simplify.labels(labels),
                ...this.obtainWikiInformationByPropsExtra(claims, extras),
              });
            }
          }
        }
        return result;
      })
      .catch((error) => {
        this.logger.debug('Error obtainWikiInformationByProps: ', error);
      });
  }

  private async updateCityDB(data: IDataCityDto): Promise<any> {
    let cityRecord = await this.cityModel.findOne({ 'city.name': data.city.name, 'country.name': data.country.name });
    const reviews = [];
    const questions = [];
    if (data.comments) {
      data.comments.forEach((item) => {
        const content = {
          text: item.text || '',
          entities: item.entities || [],
        };

        if (item.score_review > item.score_question) {
          let score = item.score_sentimental;
          score = this.updateScale(score, 0.0, 5.0, -1.0, 1.0);
          reviews.push({ ...content, score: score });
        } else {
          questions.push(content);
        }
      });
    }

    if (cityRecord) {
      this.logger.debug('Se actualiza la ciudad');
      cityRecord.reviews = [].concat(cityRecord.reviews, reviews);
      cityRecord.questions = [].concat(cityRecord.questions, questions);
      cityRecord.save();
    } else {
      this.logger.debug('Se crea un nuevo registro de la ciudad');
      cityRecord = await this.cityModel.create({
        city: data.city,
        country: data.country,
        reviews: reviews,
        questions: questions,
      });
    }
    return cityRecord.toObject();
  }

  private updateScale(unscaledNum: number, minAllowed: number, maxAllowed: number, min: number, max: number): number {
    return ((maxAllowed - minAllowed) * (unscaledNum - min)) / (max - min) + minAllowed;
  }

  private obtainWikiDataConfig() {
    return WBK({
      instance: 'https://www.wikidata.org',
      sparqlEndpoint: 'https://query.wikidata.org/sparql',
    });
  }

  private getMultiLevelProp(obj, path) {
    return path.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : null;
    }, obj || self);
  }

  private obtainWikiInformationByPropsExtra(claims: any, extras: IConfigurationValueExtra[]) {
    const result = {};
    extras.forEach((item) => {
      claims[item.id].forEach(async (itemAux) => {
        let valueAux = this.getMultiLevelProp(itemAux, item.value);
        if (item.is_value_entity && valueAux) {
          valueAux = await this.obtainWikiInformationByProps([valueAux]);
        }
        result[item.name] = valueAux;
      });
    });
    return result;
  }

  private simplifyData(data: IDataCityDto) {
    if (data.country) {
      if (data.country.wiki) {
        if (data.country.wiki.alias) {
          const valueAux = Object.assign({}, data.country.wiki.alias);
          data.country.wiki.alias = this.simplifyDataLanguageEs(valueAux);
          data.country.wiki.emoji = this.simplifyDataAliasEmoji(valueAux);
        }
        if (data.country.wiki.labels) {
          const valueAux = Object.assign({}, data.country.wiki.labels);
          data.country.wiki.labels = this.simplifyDataLanguageEs(valueAux);
        }
        if (data.country.wiki.descriptions) {
          const valueAux = Object.assign({}, data.country.wiki.descriptions);
          data.country.wiki.descriptions = this.simplifyDataLanguageEs(valueAux);
        }
        if (data.country.wiki.population) {
          const valueAux = Object.assign({}, data.country.wiki.population);
          data.country.wiki.population = this.simplifyData1LevelValue(valueAux);
        }
        if (data.country.wiki.geolocation) {
          const valueAux = Object.assign({}, data.country.wiki.geolocation);
          data.country.wiki.geolocation = this.simplifyData1LevelValue(valueAux, 0);
        }
        if (data.country.wiki.timezone) {
          const wikiCopy = Object.assign({}, data.country.wiki.timezone);
          const valueAux = this.simplifyData1LevelValue(wikiCopy.value, 0);
          data.country.wiki.timezone = {
            ...valueAux,
            description: wikiCopy.description,
            value: this.simplifyDataLanguageEs(valueAux.value),
          };
        }
        if (data.country.wiki.currency) {
          const wikiCopy = Object.assign({}, data.country.wiki.currency);
          const valueAux = this.simplifyData1LevelValue(wikiCopy);
          const valueAux2 = this.simplifyData1LevelValue(valueAux, 0);
          data.country.wiki.currency = {
            ...valueAux,
            description: wikiCopy.description,
            value: this.simplifyDataLanguageEs(valueAux2.value),
          };
        }
        if (data.country.wiki.language) {
          const valueAux = Object.assign({}, data.country.wiki.language);
          data.country.wiki.language = this.simplifyData1LevelValue(valueAux, 0);
          data.country.wiki.language.value = this.simplifyDataLanguageEs(data.country.wiki.language.value);
        }
      }
    }
    if (data.city) {
      if (data.city.wiki) {
        if (data.city.wiki.alias) {
          const valueAux = Object.assign({}, data.city.wiki.alias);
          data.city.wiki.alias = this.simplifyDataLanguageEs(valueAux);
        }
        if (data.city.wiki.labels) {
          const valueAux = Object.assign({}, data.city.wiki.labels);
          data.city.wiki.labels = this.simplifyDataLanguageEs(valueAux);
        }
        if (data.city.wiki.descriptions) {
          const valueAux = Object.assign({}, data.city.wiki.descriptions);
          data.city.wiki.descriptions = this.simplifyDataLanguageEs(valueAux);
        }
        if (data.city.wiki.population) {
          const valueAux = Object.assign({}, data.city.wiki.population);
          data.city.wiki.population = this.simplifyData1LevelValue(valueAux);
        }
        if (data.city.wiki.geolocation) {
          const valueAux = Object.assign({}, data.city.wiki.geolocation);
          data.city.wiki.geolocation = this.simplifyData1LevelValue(valueAux, 0);
        }
      }
    }
    return data;
  }

  private simplifyDataLanguageEs(valueAux: any) {
    if (Array.isArray(valueAux.es) && valueAux.es.length) {
      return valueAux.es.shift();
    } else if (valueAux.es) {
      return valueAux.es;
    }
    return valueAux;
  }

  private simplifyDataAliasEmoji(valueAux: any) {
    if (Array.isArray(valueAux.es) && valueAux.es.length) {
      return valueAux.es.find((item) => emoji.hasEmoji(item));
    }
    return null;
  }

  private simplifyData1LevelValue(valueAux: any, index: number = null) {
    let result = {
      description: valueAux.description,
      value: undefined,
    };
    if (index !== null) {
      result = {
        ...result,
        ...valueAux.value[index],
      };
    } else {
      result = {
        ...result,
        ...valueAux.value,
      };
    }
    return result;
  }
}
