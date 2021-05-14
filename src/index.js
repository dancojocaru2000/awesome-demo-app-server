const util = require('util')
const _fs = require('fs')
const fs = {
	readdirSync: _fs.readdirSync,
	readdir: util.promisify(_fs.readdir),
	stat: util.promisify(_fs.stat)
}
const express = require('express')
const app = express()
const port = 3000

app.set('view engine', 'pug')

app.use(express.static('static'))

const basedir = process.env.BASEDIR || '/build-output'
console.log(`Basedir: ${basedir}`)

function getVersions() {
	return fs.readdir(basedir)
		.then(versionNames => Promise.all(
			versionNames.map(name => Promise.all([name, fs.stat(`${basedir}/${name}`)]))
		))
		.then(versionNamesArr => versionNamesArr.filter(arr => arr[1].isDirectory).map(arr => arr[0]))
		.then(versionNames => {
			versionNames.sort((e1, e2) => parseInt(e2) - parseInt(e1))

			return Promise.all(
				versionNames.map(
					vname => Promise.all([vname, fs.readdir(`${basedir}/${vname}`)]).then(arr => ({
						name: arr[0],
						files: arr[1]
					}))
				)
			)
		})
}

app.get('/', (req, res) => {
	const versionNames = fs.readdirSync(basedir)
	versionNames.sort((e1, e2) => parseInt(e2) - parseInt(e1))
	const versions = versionNames.map(vname => {
		return {
			name: vname,
			files: fs.readdirSync(`${basedir}/${vname}`)
		}
	})

	const respondWith = req.accepts(['html', 'json'])

	if (respondWith === "json") {
		res.send(versions)
	}
	else {
		res.render('index', {
			latest: versions[0],
			versions: versions.slice(1)
		})	
	}
})

app.get('/latest.json', (req, res) => {
	getVersions()
		.then(versions => versions[0])
		.then(version => res.send(version))
		.catch(err => res.status(500).send(err))
})

app.get('/files/latest/:file', (req, res) => {
	getVersions()
		.then(versions => versions[0])
		.then(version => version.name)
		.then(version => {
			res.sendFile(`${basedir}/${version}/${req.params.file}`)
		})
		.catch(err => res.status(500).send(err))
})

app.get('/files/:version/:file', (req, res) => {
	res.sendFile(`${basedir}/${req.params.version}/${req.params.file}`)
})

app.listen(port, () => {
	console.log(`awesome-demo-app-server listening on ${port}`)
})
