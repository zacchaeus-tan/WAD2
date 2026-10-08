import fs from 'fs'
import path from 'path'

const dir = './public/geojson'
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.geojson') || f.endsWith('.json'))) {
  const fc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  for (const f of fc.features) {
    if (!['LineString', 'MultiLineString'].includes(f.geometry?.type)) continue
    console.log(f.properties['@id'], '|', f.properties.name || '(unnamed)', '|', file)
  }
}