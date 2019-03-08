import { Event } from 'cote';
import { AudioCodec, Preset, VideoCodec, VideoProfile } from '../transcode-task';

export interface TranscodeRequest extends Event {
  startTime: number;
  segmentDuration: number;
  filePath: string;
  outputDirectory: string;
  qualityOptions: {
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
  },
}