export interface M3U8PlaylistOptions {
  transcodeDirectory: string;
  fileName: string;
  videoDuration: number;
  segmentDuration: number;
  publicDir: string;
}

export const createPlaylist = (opts: M3U8PlaylistOptions): string => {
  let playlist = `#EXTM3U
#EXT-X-VERSION:4
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-TARGETDURATION:${Number(opts.segmentDuration.toFixed(0)) + 1}
#EXT-X-ALLOW-CACHE:YES
#EXT-X-MEDIA-SEQUENCE:0\n`;

  let fileSequence = 0;
  for (let i = 0; i < opts.videoDuration; i += opts.segmentDuration) {
    // noinspection UnnecessaryLocalVariableJS
    let sequence = i;
    let offset = opts.segmentDuration;

    if (opts.videoDuration - sequence < opts.segmentDuration) {
      offset = opts.videoDuration - sequence;
    }

    let segment = `#EXTINF:${offset.toFixed(0) + '.000000'},\n${opts.publicDir}/${opts.fileName}-${fileSequence}.ts\n`;
    fileSequence++;

    playlist += segment;
  }

  let footer = '#EXT-X-ENDLIST';
  playlist += footer;

  return playlist;
};
