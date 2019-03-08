# libertymediacenter/transcoder

Transcode service for LibertyMediaCenter. Features auto discovery of the main [api server](https://github.com/libertymediacenter/api)

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