/* jshint esversion: 6, node: true, mocha: true */
const path = require('path');
const expect = require('chai').expect;
const touch = require('touch');

const lib = require('../');
const root = path.resolve(__dirname, '..');
const fixture = name => path.resolve(root, 'fixtures', name);

describe('module', () => {
  let instance;

  function reset() {
    if (instance) {
      instance.close();
    }
  }

  beforeEach(reset);
  afterEach(reset);

  it('has the expected event methods', () => {
    instance = lib();

    expect(instance).to.have.all.keys([
      'on', 'once', 'off', 'add', 'remove', 'close', 'options'
    ]);

    expect(instance).to.have.property('on').and.to.be.a('function');
    expect(instance).to.have.property('once').and.to.be.a('function');
    expect(instance).to.have.property('off').and.to.be.a('function');
    expect(instance).to.have.property('add').and.to.be.a('function');
    expect(instance).to.have.property('remove').and.to.be.a('function');
    expect(instance).to.have.property('close').and.to.be.a('function');
    expect(instance).to.have.property('options').and.to.deep.equal({ persistent: true });
  });

  [{
    name: 'without options',
    beforeEach: () => { instance = lib(); },
    options: { persistent: true }
  }, {
    name: 'with { persistent: true }',
    beforeEach: () => { instance = lib({ persistent: true }); },
    options: { persistent: true }
  }, {
    name: 'with { persistent: false }',
    beforeEach: () => { instance = lib({ persistent: false }); },
    options: { persistent: false }
  }].forEach(group => {
    describe(group.name, () => {
      beforeEach(group.beforeEach);

      it('uses the expected options', () => {
        expect(instance.options).to.deep.equal(group.options);
      });

      it('listens to changes on a specific file', done => {
        instance.add(fixture('one'));
        instance.on('change', ev => {
          expect(ev).to.deep.equal({ filepath: fixture('one') });
          done();
        });

        touch(fixture('one'));
      });

      it('can listen to changes on multiple files', done => {
        const files = new Set();

        instance.add(fixture('one'));
        instance.add(fixture('two'));
        instance.add(fixture('three'));

        instance.on('change', ev => {
          files.add(ev.filepath);

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
  });

});
