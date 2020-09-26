import { Inject, Service } from 'typedi';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import TypeNpl from '../models/enum/typeNpl';
import { TextAnalyticsClient } from '@azure/ai-text-analytics';
import { Options, PythonShell } from 'python-shell';

@Service()
export default class NplService {
  constructor(
    @Inject('logger') private logger,
    @Inject('clientAzure') private clientAzure: TextAnalyticsClient,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async sentimentAnalysis(text: string, type: TypeNpl): Promise<any> {
    switch (type) {
      case TypeNpl.Azure:
        const result = {
          ner: undefined,
          sentiment: undefined,
          sentimentScore: undefined,
        };
        result.ner = await this.clientAzure.recognizeEntities(Array.of(text));
        result.sentiment = await this.clientAzure.analyzeSentiment(Array.of(text));
        result.sentimentScore = await this.executePython(text);
        return result;
      case TypeNpl.Scapy:
        return '';
    }
    return '';
  }

  public async entityRecognition(text: string, type: TypeNpl): Promise<any> {
    if (type === TypeNpl.Azure) {
      return this.clientAzure.recognizeEntities(Array.of(text));
    }
    return '';
  }

  private async executePython(text: string): Promise<any> {
    const options = {
      mode: 'text',
      pythonPath: '/home/josue/PycharmProjects/travelBuddyNpl/venv/bin/python',
      pythonOptions: ['-u'],
      scriptPath: '/home/josue/PycharmProjects/travelBuddyNpl',
      args: [`-t "${text}"`],
    } as Options;
    const filePython = 'main.py';

    return new Promise((resolve, reject) => {
      let result;
      const pyshell = new PythonShell(filePython, options);

      pyshell.on('message', function (message) {
        // result = JSON.parse(message);
        result = message;
      });

      pyshell.on('stderr', function (stderr) {
        console.log(stderr);
      });

      pyshell.end(function (err, code, signal) {
        if (err) reject(err);
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');
        resolve(result);
      });
    });
  }
}
