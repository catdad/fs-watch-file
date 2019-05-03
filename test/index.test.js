/* jshint esversion: 6, node: true, mocha: true */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const EventEmitter = require('events');
const expect = require('chai').expect;
const touch = require('touch');

const libpath = require.resolve('../');
const libtext = fs.readFileSync(libpath, 'utf8');
const lib = require(libpath);
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

  describe('in case of emergency', () => {
    const vmLib = (watch, options) => {
      const module = {};
      const sandbox = vm.createContext({
        require: (id) => {
          switch (id) {
            case 'events':
              return EventEmitter;
            case 'fs':
              return { watch };
          }

          throw new Error('unknown required id: ' + id);
        },
        module
      });

      instance = vm.runInContext(libtext, sandbox, { filename: libpath })(options);
    };

    it('emits an error if a file watcher closes unexpectedly', done => {
      const name = 'pineapples';

      vmLib((file, opts, cb) => {
        setTimeout(() => {
          cb('close');
        }, 1);

        return {};
      });

      instance.on('error', err => {
        expect(err).to.have.property('code', 'UnexpectedClose');
        expect(err).to.have.property('filepath', name);
        expect(err).to.have.property('message', 'watcher closed unexpectedly');

        done();
      });

      instance.add(name);
    });

    it('emits an error if a file watcher errors unexpectedly', done => {
      const name = 'bananas';

      vmLib((file, opts, cb) => {
        setTimeout(() => {
          cb('error');
        }, 1);

        return {};
      });

      instance.on('error', err => {
        expect(err).to.have.property('code', 'UnexpectedError');
        expect(err).to.have.property('filepath', name);
        expect(err).to.have.property('message', 'watcher errored');

        done();
      });

      instance.add(name);
    });

    it('emits an error if an unknown event occurs', done => {
      const name = 'mango';

      vmLib((file, opts, cb) => {
        setTimeout(() => {
          cb('cheese');
        }, 1);

        return {};
      });

      instance.on('error', err => {
        expect(err).to.have.property('code', 'UnexpectedEvent');
        expect(err).to.have.property('filepath', name);
        expect(err).to.have.property('message', 'watcher behaved unexpectedly');

        done();
      });

      instance.add(name);
    });

    it('watches only once even when the same file is added multiple times', done => {
      const name = 'kiwi';
      let count = 0;

      vmLib((file, opts, cb) => {
        count += 1;

        setTimeout(() => {
          expect(count).to.equal(1);
          done();
        }, 1);

        return { close: () => {} };
      });

      instance.add(name);
      instance.add(name);
      instance.add(name);
      instance.add(name);
    });

    it('removes only once even if it is called multiple times', () => {
      const name = 'kiwi';
      let count = 0;

      vmLib((file, opts, cb) => {
        return { close: () => {
          count += 1;
        } };
      });

      instance.add(name);
      expect(count).to.equal(0);

      instance.remove(name);
      expect(count).to.equal(1);

      instance.remove(name);
      expect(count).to.equal(1);
    });
  });

});
