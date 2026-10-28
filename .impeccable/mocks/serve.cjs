// Minimal static server for the CAIRN mockups.
const http = require('http')
const fs = require('fs')
const path = require('path')
const root = path.resolve(process.argv[2])
const port = Number(process.argv[3] || 5179)
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }
http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0])
    if (p === '/') p = '/index.html'
    const file = path.join(root, p)
    if (!file.startsWith(root)) { res.writeHead(403); return res.end() }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found') }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
      res.end(data)
    })
  })
  .listen(port, () => console.log('mocks on http://localhost:' + port))
