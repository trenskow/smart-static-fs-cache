'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const Cache = require('@donotjs/donot-cache');

class FileSystemCache extends Cache {

	constructor(cacheDir, opt) {
		super();

		this.cacheFile = path.normalize(cacheDir + '/cache.json');

		if ((opt || {}).createDirectory === true) {
			mkdirp.sync(cacheDir);
		}

		if (!fs.existsSync(cacheDir)) {
			throw new Error('Cache directory does not exist.');
		}
	}

	_readCache() {
		return new Promise((resolved, rejected) => {
			// First check if file exists
			fs.exists(this.cacheFile, (exists) => {
				if (!exists) return resolved({});

				// Read file content.
				fs.readFile(this.cacheFile, { encoding: 'utf8' }, (err, data) => {
					if (err) return rejected(err);
					resolved(JSON.parse(data) || {});
				});

			});
		});
	}

	_writeCache(cache) {
		return new Promise((resolved, rejected) => {

			// Write JSON to file
			fs.writeFile(this.cacheFile, JSON.stringify(cache), { encoding: 'utf8' }, (err) => {
				if (err) return rejected(err);
				resolved();
			});

		});
	}

	get(filename) {
		return new Promise((resolved, rejected) => {

			this._readCache().then((cache) => {

				// Default if non-existing
				cache = cache || {};

				// Convert to correct types.
				if (cache[filename]) {
					if (cache[filename].modificationDate) {
						cache[filename].modificationDate = new Date(cache[filename].modificationDate);
						cache[filename].data = new Buffer(cache[filename].data.data);
					}
				}

				// Return content
				resolved(cache[filename]);

			}, rejected);

		});
	}

	set(filename, data) {
		return new Promise((resolved, rejected) => {

			// Read file
			this._readCache().then((cache) => {

				// Add data
				cache[filename] = data;

				this._writeCache(cache).then(resolved, rejected);

			}, rejected);

		});
	}

	invalidate(filename) {
		return new Promise((resolved, rejected) => {
			this._readCache().then((cache) => {
				delete cache[filename];
				this._writeCache().then(resolved, rejected);
			}, rejected);
		});
	}

}

exports = module.exports = FileSystemCache;
