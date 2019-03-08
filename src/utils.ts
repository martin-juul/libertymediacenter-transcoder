import * as crypto from 'crypto';
import { FFProbeResult, Format, Stream } from './interfaces/ffprobe.interfaces';
import { TranscodeJob } from './interfaces/transcode-job.interface';
import { TranscodeRequest } from './interfaces/transcode-request.interface';
import { TranscodingOptions } from './transcode-task';
import * as ffmpeg from 'fluent-ffmpeg';

export const sha256 = (input: string) => {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(input), 'utf8')
    .digest('hex');
};

export const ffprobe = (filePath: string): Promise<FFProbeResult> => {
  return new Promise(((resolve, reject) => {
    ffmpeg(filePath)
      .ffprobe(((err, data) => {
        if (err) reject(err);

        const result: FFProbeResult = {
          streams: data.streams as Stream[],
          format: data.format as Format,
          chapters: data.chapters,
        };

        resolve(result);
      }));
  }));
};

export const createJob = async (request: TranscodeRequest): Promise<TranscodeJob> => {
  const probe = await ffprobe(request.filePath);

  const startTime = (): number => {
    const reqStart = request.startTime - probe.format.start_time;
    if (reqStart >= probe.format.start_time) {
      return reqStart;
    }

    return probe.format.start_time;
  };

  const jobOptions: TranscodingOptions = {
    startTime: startTime(),
    fileDuration: probe.format.duration,
    segmentDuration: request.segmentDuration,
    audio: request.qualityOptions.audio,
    video: request.qualityOptions.video,
    preset: request.qualityOptions.preset,
  };

  return {
    filePath: request.filePath,
    outputDirectory: request.outputDirectory,
    options: jobOptions,
  };
};