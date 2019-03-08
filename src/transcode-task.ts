import { createPlaylist } from './hls-playlist';
import { TaskID } from './interfaces/task.interface';
import { segmenter, SegmenterOptions } from './segmenter';
import { ChildProcess } from 'child_process';
import { eventBus } from './main';
import { $log } from 'ts-log-debug';
import { basename } from 'path';
import * as fse from 'fs-extra';

export enum TranscodeTaskEvent {
  STOPPED = 'transcode_task#stopped',
}

export class TranscodeTask {
  private readonly _taskId: TaskID;
  private readonly _filePath: string;
  private readonly _outputDirectory: string;
  private readonly _transcodingOptions: TranscodingOptions;
  private process: ChildProcess;

  constructor(taskId: TaskID, filePath: string, outputDirectory: string, transcodingOptions: TranscodingOptions) {
    this._taskId = taskId;
    this._filePath = filePath;
    this._outputDirectory = outputDirectory;
    this._transcodingOptions = transcodingOptions;
  }

  public async start() {
    const videoBitrate = this._transcodingOptions.video.bitrate;
    const videoCodec = this._transcodingOptions.video.codec;
    const audioBitrate = this._transcodingOptions.audio.bitrate;
    const audioCodec = this._transcodingOptions.audio.codec;

    const options = this.buildSegmenterOptions();

    return new Promise<string>((async (resolve, reject) => {
      try {
        await fse.mkdirs(options.paths.outputDir);
        $log.info(`[Transcode]: started new task. ${basename(this._filePath)} | V:${videoBitrate}kbps ${videoCodec} | A:${audioBitrate}kbps ${audioCodec}`);

        const playlistOptions = {
          transcodeDirectory: options.paths.outputDir,
          prependSegmentName: options.paths.outputFilePrepend,
          videoDuration: options.timing.duration,
          segmentDuration: options.timing.segmentDuration,
        };

        const playlistPath = await this.makePlaylist(playlistOptions);
        this.process = segmenter(options);

        resolve(playlistPath);
      } catch (e) {
        reject(e)
      }

    }));
  }

  public stop() {
    return new Promise((resolve => {
      this.process.kill('SIGTERM');
      eventBus.emit(TranscodeTaskEvent.STOPPED);

      resolve();
    }));
  }

  private async makePlaylist(options: {transcodeDirectory: string, prependSegmentName: string, videoDuration: number, segmentDuration: number}) {
    return new Promise<string>(((resolve, reject) => {

      const playlist = createPlaylist({
        transcodeDirectory: options.transcodeDirectory,
        fileName: options.prependSegmentName,
        videoDuration: options.videoDuration,
        segmentDuration: options.segmentDuration,
        publicDir: `/transcode/${this._taskId.folderId}`
      });

      const fullPath = `${options.transcodeDirectory}/${options.prependSegmentName}.m3u8`;
      fse.writeFile(`${fullPath}`, playlist)
        .then(() => resolve(fullPath))
        .catch(reject);
    }))
  }

  private buildSegmenterOptions(): SegmenterOptions {
    return {
      paths: {
        filePath: this._filePath,
        outputDir: `${this._outputDirectory}/${this._taskId.folderId}`,
        outputFilePrepend: this._taskId.prependFileId,
      },
      timing: {
        startTime: this._transcodingOptions.startTime,
        duration: this._transcodingOptions.fileDuration,
        segmentDuration: this._transcodingOptions.segmentDuration,
      },
      settings: {
        audioBitrate: this._transcodingOptions.audio.bitrate,
        audioChannels: this._transcodingOptions.audio.channels,
        audioCodec: this._transcodingOptions.audio.codec,
        videoBitrate: this._transcodingOptions.video.bitrate,
        videoCodec: this.getVideoCodec(),
        preset: this._transcodingOptions.preset,
        x264_profile: this._transcodingOptions.video.profile,
        threads: 1,
      },
    };
  }

  /**
   * Get the system codec
   */
  private getVideoCodec() {
    if (this._transcodingOptions.video.codec === VideoCodec.X264) {
      return 'libx264';
    }

    throw new Error('Could not get video codec!');
  }
}

export enum AudioCodec {
  AAC = 'aac',
}

export enum VideoCodec {
  X264 = 'x264',
}

export enum VideoResolution {
  HD2160 = 2160,
  HD1440 = 1440,
  HD1080P = 1080,
  HD720P = 720,
  SD576P = 576,
  SD432P = 432,
  SD360P = 360
}

export enum Preset {
  ULTRAFAST = 'ultrafast',
  SUPERFAST = 'superfast',
  VERYFAST = 'veryfast',
  FASTER = 'faster',
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow',
  SLOWER = 'slower',
  VERYSLOW = 'veryslow',
}

export enum VideoProfile {
  BASELINE = 'baseline',
  MAIN = 'main',
  HIGH10 = 'high10',
  HIGH422 = 'high422',
  HIGH444 = 'high444'
}

export interface TranscodingOptions {
  audio: {
    codec: AudioCodec;
    bitrate: number; // kbps
    channels: number;
  };
  video: {
    codec: VideoCodec;
    bitrate: number; // kbps
    profile: VideoProfile;
  };
  preset: Preset;
  startTime: number;
  fileDuration: number;
  segmentDuration: number;
}
