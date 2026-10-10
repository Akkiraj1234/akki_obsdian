import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const BUMP_TYPES = new Set(['major', 'minor', 'patch']);
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function run(command, args) {
	const result = spawnSync(command, args, { stdio: 'inherit' });
	if (result.error) {
		console.error(`Could not run ${command}: ${result.error.message}`);
		process.exit(1);
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

function readVersion(file) {
	return JSON.parse(readFileSync(file, 'utf8')).version;
}

function compareVersions(left, right) {
	const leftParts = left.split('.').map(Number);
	const rightParts = right.split('.').map(Number);
	for (let index = 0; index < leftParts.length; index += 1) {
		const difference = leftParts[index] - rightParts[index];
		if (difference !== 0) return difference;
	}
	return 0;
}

function fail(message) {
	console.error(`Release aborted: ${message}`);
	process.exit(1);
}

const [requestedVersion = 'patch', ...extraArguments] = process.argv.slice(2);
if (extraArguments.length > 0) {
	fail('pass one version only: major, minor, patch, or x.y.z.');
}

const currentVersion = readVersion('package.json');
if (!BUMP_TYPES.has(requestedVersion) && !SEMVER.test(requestedVersion)) {
	fail('version must be major, minor, patch, or a stable x.y.z version.');
}
if (SEMVER.test(requestedVersion) && compareVersions(requestedVersion, currentVersion) <= 0) {
	fail(`the requested version (${requestedVersion}) must be greater than ${currentVersion}.`);
}

const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
if (status.status !== 0) fail('could not read the Git working tree.');
if (status.stdout.trim()) fail('commit or stash all changes before releasing.');

const branch = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
if (branch.status !== 0 || !branch.stdout.trim()) fail('releases must run from a named Git branch.');

const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
if (remote.status !== 0) fail('the Git remote named origin is required.');

console.log('Checking lint and production build...');
run('npm', ['run', 'lint']);
run('npm', ['run', 'build']);

// The npm "version" lifecycle runs version-bump.mjs, which synchronizes the
// manifest and Obsidian version map after npm updates package.json.
run('npm', ['version', requestedVersion, '--no-git-tag-version']);

const releaseVersion = readVersion('package.json');
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
if (manifest.version !== releaseVersion) {
	fail('manifest.json was not synchronized with package.json.');
}
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
if (versions[releaseVersion] !== manifest.minAppVersion) {
	fail('versions.json was not synchronized with manifest.json.');
}

run('git', ['add', 'package.json', 'package-lock.json', 'manifest.json', 'versions.json']);
run('git', ['commit', '-m', `release: ${releaseVersion}`]);
run('git', ['tag', '-a', releaseVersion, '-m', `Release ${releaseVersion}`]);
run('git', ['push', 'origin', 'HEAD', `refs/tags/${releaseVersion}`]);

console.log(`Released ${releaseVersion}. GitHub Actions will publish the release from the tag.`);
