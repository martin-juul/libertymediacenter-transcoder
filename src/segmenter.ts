import * as Path from 'path';
import * as childProcess from 'child_process';
import { $log } from 'ts-log-debug';
import { ChildProcess } from 'child_process';

export interface SegmenterOptions {
  paths: {
    filePath: string;
    outputDir: string;
    outputFilePrepend: string;
  },
  timing: {
    startTime: number;
    duration: number;
    segmentDuration: number;
  },
  settings: {
    audioBitrate: number;
    audioChannels: number;
    audioCodec: string;
    videoBitrate: number;
    videoCodec: string;
    preset: string;
    x264_profile: string;
    threads: number;
  };
}

export const segmenter = (opts: SegmenterOptions): ChildProcess => {
  $log.debug(`
===========================================
-> Start segmenter:
Input File: ${opts.paths.filePath}
Output Dir: ${opts.paths.outputDir}
Range    : ${opts.timing.startTime} - ${opts.timing.startTime + opts.timing.duration - 1}
Segment Duration      : ${opts.timing.segmentDuration}
===========================================`);

  const duration = (opts.timing.duration === Infinity) ? 0 : opts.timing.duration;

  const args = [
    '-loglevel', 'error', '-stats',
    '-progress', 'pipe:1',
    '-ss', `${opts.timing.startTime}`,
    '-i', `${opts.paths.filePath}`,
    '-t', `${duration}`,
    '-force_key_frames', `expr:gte(t,n_forced*${opts.timing.segmentDuration})`,
    '-codec:v', `${opts.settings.videoCodec}`,
    '-b:v', `${opts.settings.videoBitrate}k`,
    '-preset', `${opts.settings.preset}`,
    '-profile:v', `${opts.settings.x264_profile}`,
    '-codec:a', `${opts.settings.audioCodec}`,
    '-b:a', `${opts.settings.audioBitrate}k`,
    '-ac', `${opts.settings.audioChannels}`,
    '-threads', `${opts.settings.threads}`,
    '-vsync', '1',
    '-map_metadata', '-1',
    '-map_chapters', '-1',
    '-bsf:v', 'h264_mp4toannexb',
    '-pix_fmt', 'yuv420p',
    // set start_time in .ts file metadata, check using `ffprobe` or `mediainfo`
    '-initial_offset', `${opts.timing.startTime}`, // todo: check significance of this
    '-f', 'segment',
    '-segment_list_type', 'm3u8',
    '-segment_list_size', '0',
    '-segment_start_number', `${opts.timing.startTime}`,
    '-segment_time', `${opts.timing.segmentDuration}`,
    '-segment_time_delta', '0.001',
    '-segment_list', `${Path.join(opts.paths.outputDir, `${opts.paths.outputFilePrepend}-out.m3u8`)}`,
    `${Path.join(opts.paths.outputDir, `${opts.paths.outputFilePrepend}-%d.ts`)}`,
  ];

  return childProcess.spawn('ffmpeg', args);
};
