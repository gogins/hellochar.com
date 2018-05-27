Workshop for developing new visual music pieces inspired by (**not** copies of!) the work of [Xiaohan Zhang](https://www.hellochar.com).

Development
===========

Run `yarn` to configure the repository.

Run `yarn start` to start webpack-dev-server.

Deploying
=========

No need to deploy. But if there is, run `yarn prod` on an external server (e.g. Heroku). This will
compile the ts into /public/app.js and run a local node express
server which points public/ as a content base, hooking up
index.html to find /app.js and /assets/ properly.
