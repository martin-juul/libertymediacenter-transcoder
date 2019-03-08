import * as cote from 'cote';
import * as dotenv from 'dotenv';
import { EventEmitter2 } from 'eventemitter2';
import { $log } from 'ts-log-debug';
import { TranscodeRequest } from './interfaces/transcode-request.interface';
import { TranscodeManager } from './transcode-manager';
import { AudioCodec, Preset, VideoCodec, VideoProfile } from './transcode-task';
import { createJob } from './utils';

const rootDir = __dirname;
dotenv.config({ path: `${rootDir}/../.env` });

export enum GlobalEvent {
  KILL = 'global#kill',
  KILL_COMPLETE = 'global#kill_complete',
}

$log.name = 'LibertyTranscoder';
$log.appenders.set('file-info', {
  type: 'file',
  filename: 'transcoder.log',
  maxLogSize: 10485760,
});

// internal application wide bus
export const eventBus = new EventEmitter2();

class Main {
  private _responder: cote.Responder;
  private readonly _manager: TranscodeManager;

  constructor() {
    this._manager = new TranscodeManager();

    this._responder = new cote.Responder({
      name: 'Transcoding Service',
      key: 'transcode',
      namespace: 'internal',
    });
  }

  public start() {
    this._responder.on<TranscodeRequest>('transcode-request', async (request) => {
      const job = await createJob(request);

      return new Promise(((resolve, reject) => {
        this._manager.add(job)
          .then((task) => {

            resolve({playlistPath: task.playlistPath});
          }).catch((e) => {
          $log.error('Could not start transcode job', e);

          reject({ msg: e.message });
        });
      }));
    });
  }

  public stop(): Promise<void> {
    eventBus.emit(GlobalEvent.KILL);

    return new Promise((resolve => {
      eventBus.once(GlobalEvent.KILL_COMPLETE, () => resolve);
    }));
  }

  public async testTranscode() {
    const request: TranscodeRequest = {
      type: 'transcode-request',
      startTime: 0,
      segmentDuration: 10,
      filePath: '/Users/martin/Movies/Unfriended (2015)/Unfriended (2014) Bluray-1080p.mkv',
      outputDirectory: '/Volumes/Dev/personal/LibreMediaCenter/liberty-api/public/transcode',
      qualityOptions: {
        audio: {
          codec: AudioCodec.AAC,
          bitrate: 192,
          channels: 2
        },
        video: {
          codec: VideoCodec.X264,
          bitrate: 1000,
          profile: VideoProfile.MAIN,
        },
        preset: Preset.ULTRAFAST,
      },
    };

    const job = await createJob(request);

    const newTask = await this._manager.add(job);

    $log.debug('[TestTranscode]: New Task!', newTask)
  }
}

const app = new Main();

app.start();

( async () => {
  //await app.testTranscode();
})();

process.once('beforeExit', (code) => {
  console.log(`Received exit code: ${code} - shutting down.`);

  app.stop()
    .then(() => console.log('stopped transcoder'));
});
