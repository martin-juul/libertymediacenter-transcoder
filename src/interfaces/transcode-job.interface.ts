import { TranscodingOptions } from '../transcode-task';

export interface TranscodeJob {
  filePath: string;
  outputDirectory: string;
  options: TranscodingOptions;
}
