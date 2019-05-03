# fs-watch-file

[![travis][travis.svg]][travis.link]
[![cov-coveralls][cov-coveralls.svg]][cov-coveralls.link]
[![npm-downloads][npm-downloads.svg]][npm.link]
[![npm-version][npm-version.svg]][npm.link]

[travis.svg]: https://travis-ci.com/catdad/fs-watch-file.svg?branch=master
[travis.link]: https://travis-ci.com/catdad/fs-watch-file
[cov-coveralls.svg]: https://img.shields.io/coveralls/catdad/fs-watch-file.svg
[cov-coveralls.link]: https://coveralls.io/github/catdad/fs-watch-file?branch=master
[npm-downloads.svg]: https://img.shields.io/npm/dm/fs-watch-file.svg
[npm.link]: https://www.npmjs.com/package/fs-watch-file
[npm-version.svg]: https://img.shields.io/npm/v/fs-watch-file.svg

This module is a very thin wrapper around [`fs.watch`](https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fs_watch_filename_options_listener) with a focus on allowing you to watch only specific files for changes. This module is not meant as a complete file watching solution -- for that, you may want to look at [`chokidar`](https://www.npmjs.com/package/chokidar). Instead, if you would like to watch already known files (perhaps you [already globbed them](https://www.npmjs.com/package/globby) on your own) amd would like to do so in a cross-platform way with no dependencies, then this module might be for you.

## Install

```bash
npm install fs-watch-file
```

## Usage

```javascript
const watch = require('fs-watch-file');
const watcher = watch({ persistent: false });

// add paths to already-known files
watcher.add('/path/to/file/one');
watcher.add('/path/to/file/two');
watcher.add('/path/to/file/three');

// get notified on changes
watcher.on('change', ev => {
  console.log(`file changed: ${ev.filepath}`);
});

// get notified on errors
watcher.on('error', err => {
  console.log(`file no longer being watched: ${err.filepath}`);

  // optionally, go ahead and add a watcher again
  watcher.add(err.filepath);
});

// stop watching everything
watcher.close();
```

### watcher options

* `[persistent = true]` _{boolean}_: this maps to node's `fs.watch(filename, { persistent })` option, and defined whether the file watcher should keep the process alive or not

### `add(filepath)`

This method adds a watcher for a specific file. The exact `filepath` value will be passed into `fs.watch` and will also be used when `change` or `error` events are triggered.

### `remove(filepath)`

This method removes the watcher for a specific file. The exact `filepath` value is used to match existing watchers.

### `close()`

Stop all file watching. No more events will be fired after this is called. You are free to add more files to be watched after this.

### Events

You can use `on`, `once`, and `off` to add event listeners as you would expect. The following events are triggered:

* `change`: A file has changed. This event has a single object as its argument, with the following properties:
  * `filepath`: the argument passed into `watcher.add`
* `error`: An unexpected thing has happened and the file will no longer be watched. This event has a single `Error` as its argument, with the following properties:
  * `code`: a unique error code, either `UnexpectedClose` or `UnexpectedError`
  * `filepath`: the argument passed into `watcher.add`
