import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(projectDir, 'workflow.json');

function fail(message) {
	console.error(`Build-test failed: ${message}`);
	process.exit(1);
}

let config;
try {
	config = JSON.parse(await readFile(configPath, 'utf8'));
} catch (error) {
	if (error.code === 'ENOENT') fail('workflow.json is missing. Create it with a testVaultPath pointing to your Obsidian vault.');
	fail(`could not read workflow.json: ${error.message}`);
}

if (typeof config.testVaultPath !== 'string' || !config.testVaultPath.trim()) {
	fail('workflow.json must contain a non-empty "testVaultPath" string.');
}

const vaultPath = path.resolve(config.testVaultPath);
try {
	await access(vaultPath, constants.R_OK);
} catch {
	fail(`the configured test vault does not exist or cannot be read: ${vaultPath}`);
}

console.log('Building OnePlugin...');
const build = spawnSync(
	process.platform === 'win32' ? 'cmd.exe' : 'npm',
	process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'],
	{
		cwd: projectDir,
		stdio: 'inherit',
	},
);
if (build.error) fail(`could not start npm build: ${build.error.message}`);
if (build.status !== 0) fail(`npm run build exited with status ${build.status ?? 'unknown'}.`);

let manifest;
try {
	manifest = JSON.parse(await readFile(path.join(projectDir, 'manifest.json'), 'utf8'));
} catch (error) {
	fail(`could not read manifest.json: ${error.message}`);
}
if (typeof manifest.id !== 'string' || !manifest.id.trim()) fail('manifest.json must contain a plugin id.');

const packageJson = JSON.parse(await readFile(path.join(projectDir, 'package.json'), 'utf8'));
const outputDir = path.join(projectDir, 'build', packageJson.name);
const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', manifest.id);
try {
	await mkdir(pluginDir, { recursive: true });
	await access(pluginDir, constants.R_OK | constants.W_OK);
} catch {
	fail(`plugin folder cannot be created or is not writable: ${pluginDir}`);
}

for (const filename of ['main.js', 'manifest.json', 'styles.css']) {
	const source = path.join(outputDir, filename);
	try {
		await access(source, constants.R_OK);
	} catch (error) {
		if (filename === 'styles.css' && error.code === 'ENOENT') continue;
		fail(`build output is missing ${filename}: ${source}`);
	}
	await copyFile(source, path.join(pluginDir, filename));
}
console.log(`Copied OnePlugin to ${pluginDir}`);

let isRunning = false;
if (process.platform === 'win32') {
	const check = spawnSync('tasklist', ['/FI', 'IMAGENAME eq Obsidian.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8' });
	isRunning = check.status === 0 && /"Obsidian\.exe"/i.test(check.stdout);
} else if (process.platform === 'darwin') {
	const check = spawnSync('pgrep', ['-x', 'Obsidian'], { stdio: 'ignore' });
	isRunning = check.status === 0;
}

if (isRunning) {
	console.log('Obsidian is already running. Reload OnePlugin in Obsidian to apply the changes.');
	process.exit(0);
}

const vaultUri = `obsidian://open?${new URLSearchParams({ path: vaultPath })}`;
let opener;
if (process.platform === 'win32') {
	opener = spawn('cmd.exe', ['/c', 'start', '', vaultUri], { detached: true, stdio: 'ignore' });
} else if (process.platform === 'darwin') {
	opener = spawn('open', [vaultUri], { detached: true, stdio: 'ignore' });
} else {
	console.log('Build and copy completed. Open Obsidian and select the configured test vault manually.');
	process.exit(0);
}
opener.on('error', () => {
	console.log('Build and copy completed, but Obsidian could not be opened automatically. Open Obsidian and select the configured test vault manually.');
});
opener.on('spawn', () => {
	opener.unref();
	console.log('Opening the configured test vault in Obsidian. Reload OnePlugin if it is already open.');
});
