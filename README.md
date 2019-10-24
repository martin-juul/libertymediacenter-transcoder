> :warning: **EXPERIMENTAL**: It's not even close to be considered for use. It can start transcodes, and seeking works. It's just very unstable. Expect it to crash and make your CPU hurt. It doesn't cleanup ffmpeg processes if you kill the app. So you have to pkill them yourself.

# libertymediacenter/transcoder

Transcode service for LibertyMediaCenter. Features auto discovery of the main [api server](https://github.com/martin-juul/libertymediacenter-api)

## Development

Make sure you have node.js v10.15+ & yarn installed.

### Install the dependencies

```bash
$ yarn install
```

### Start the app

```bash
$ yarn start:dev
```

If you have the api server started, you should see similar output to this:

```
yarn run v1.13.0
$ nodemon
[nodemon] 1.18.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: src/**/*.ts
[nodemon] starting `ts-node ./src/main.ts`

Hello! I'm Transcoding Service#21dfa8c6-998e-46e4-92c1-626190ebfade on 8000
========================
```
