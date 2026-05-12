import { readFile, writeFile } from 'node:fs/promises'

const packagePath = new URL('../package.json', import.meta.url)
const manifestPath = new URL('../companion/manifest.json', import.meta.url)
const readmePath = new URL('../README.md', import.meta.url)

const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const manifestJson = JSON.parse(await readFile(manifestPath, 'utf8'))

const currentVersion = String(packageJson.version)
const nextVersion = incrementBetaVersion(currentVersion)

packageJson.version = nextVersion
manifestJson.version = nextVersion

await writeJson(packagePath, packageJson)
await writeJson(manifestPath, manifestJson)
await updateReadmePackageName(nextVersion, String(manifestJson.id))

console.log(`Bumped build version: ${currentVersion} -> ${nextVersion}`)

function incrementBetaVersion(version) {
	const match = version.match(/^(\d+\.\d+\.\d+)-beta\.(\d+)$/)
	if (!match) {
		throw new Error(`Expected version to match MAJOR.MINOR.PATCH-beta.N, received "${version}"`)
	}

	return `${match[1]}-beta.${Number(match[2]) + 1}`
}

async function writeJson(path, value) {
	await writeFile(path, `${JSON.stringify(value, null, '\t')}\n`)
}

async function updateReadmePackageName(version, moduleId) {
	const readme = await readFile(readmePath, 'utf8')
	const nextReadme = readme.replace(
		new RegExp(`${escapeRegExp(moduleId)}-\\d+\\.\\d+\\.\\d+-beta\\.\\d+\\.tgz`, 'g'),
		`${moduleId}-${version}.tgz`,
	)
	await writeFile(readmePath, nextReadme)
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
