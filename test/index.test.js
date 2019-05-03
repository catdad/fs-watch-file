/* jshint esversion: 6, node: true, mocha: true */
const path = require('path');
const expect = require('chai').expect;
const touch = require('touch');

const lib = require('../')();
const root = path.resolve(__dirname, '..');
const fixture = name => path.resolve(root, 'fixtures', name);

describe('module', () => {
  beforeEach(() => {
    lib.close();
    lib.removeAllListeners();
  });
  afterEach(() => {
    lib.close();
    lib.removeAllListeners();
  });

  it('listens to changes on a specific file', done => {
    lib.add(fixture('one'));
    lib.on('change', ev => {
      expect(ev).to.deep.equal({ file: fixture('one') });
      done();
    });

    touch(fixture('one'));
  });

  it('can listen to changes on multiple files', done => {
    const files = new Set();

    lib.add(fixture('one'));
    lib.add(fixture('two'));
    lib.add(fixture('three'));

    lib.on('change', ev => {
      files.add(ev.file);

      if (files.size === 3) {
        expect(Array.from(files).sort()).to.deep.equal([
          fixture('one'),
          fixture('three'),
          fixture('two'),
        ]);

        done();
      }
    });

    touch(fixture('one'));
    touch(fixture('two'));
    touch(fixture('three'));
  });
});
