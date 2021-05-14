const fs = require('fs')
const express = require('express')
const app = express()
const port = 3000

app.set('view engine', 'pug')

app.use(express.static('static'))

app.get('/', (req, res) => {
	const versionNames = fs.readdirSync('/build-output')
	versionNames.sort((e1, e2) => parseInt(e2) - parseInt(e1))
	const versions = versionNames.map(vname => {
		return {
			name: vname,
			files: fs.readdirSync(`/build-output/${vname}`)
		}
	})

	res.render('index', {
		latest: versions[0],
		versions: versions
	})	
})

app.get('/files/:version/:file', (req, res) => {
	res.sendFile(`/build-output/${req.params.version}/${req.params.file}`)
})

app.listen(port, () => {
	console.log(`awesome-demo-app-server listening on ${port}`)
})
