'use strict';

var semver = require('semver'),
	exec   = require('child-process-promise').exec,
	cwd    = process.cwd(),
	fs     = require('fs'),
	indent = require('detect-indent'),
	version;

function logError(err) {
	console.log(err);
}

exports.manifests = function() {
	return ['package.json', 'bower.json', 'component.json'].filter(function(manifest) {
		return fs.existsSync(cwd + '/' + manifest);
	});
};

exports.versionInfo = function(manifest) {
	var pkg = cwd + '/' + manifest;
	var current = require(pkg);

	return {
		current: current.version,
		nextMajor: semver.inc(current.version, 'major'),
		nextMinor: semver.inc(current.version, 'minor'),
		nextPatch: semver.inc(current.version, 'patch')
	};
};

exports.bump = function(manifest, type) {
	var pkg = cwd + '/' + manifest;

	var current = require(pkg);

	current.version = semver.inc(current.version, type);

	version = current.version;

	var usedIndent = indent(fs.readFileSync(pkg, 'utf8')).indent || '  ';

	fs.writeFileSync(pkg, JSON.stringify(current, null, usedIndent));
};

exports.tag = function(push) {
	exec('git commit ' + exports.manifests().join(' ') + ' -m "release v' + version + '"')
		.then(function() {
			// console.log(out.stdout);
			return exec('git tag v' + version);
		}, logError)

		.then(function() {
			console.log('Updated to', version);
			return push && exec('git push && git push --tags');
		}, logError)

		.then(function(out) {
			if (out) {
				console.log(out.stdout);
			}
		}, logError);
};
