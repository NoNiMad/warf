const path = require('path')
const fs   = require('fs')
const server = require('server')
const router = server.router

function parseSegmentName(segment) {
  segment = segment.replace('$', ':')
  return segment
}

function loadRoutes(dir, route) {
  let loaded = []

  let dirContent = fs.readdirSync(dir)
  dirContent.sort().reverse()
  dirContent.forEach(segment => {
    let calculatedPath = path.join(dir, segment)
    let stats = fs.statSync(calculatedPath)

    if (stats.isDirectory()) {
      let subroutes = loadRoutes(calculatedPath, `${route}${parseSegmentName(segment)}/`)
      if (subroutes.length > 0) {
        loaded = loaded.concat(subroutes)
      }
    } else {
      let controller = require(calculatedPath)(server.reply)
      
      let endpoint = ''
      if (segment.endsWith('.js'))
        endpoint = segment.substring(0, segment.length - 3)
      
      if (endpoint === '__index__' && route == '/')
        endpoint = ''
      else
        endpoint = parseSegmentName(endpoint)

      for (let method in controller) {
        console.log(`[router] ${method.toUpperCase()} ${route}${endpoint}`)
        if (router[method] === undefined) {
          console.error(`Invalid method name in ${content} : ${method}`)
          continue
        }
        loaded.push(router[method](`${route}${endpoint}`, controller[method]))
      }
    }
  })

  return loaded
}

module.exports = {
  init(config) {
    let routes = loadRoutes(config.folders.routes, '/')
    console.log(`[router] => ${routes.length} routes loaded`)

    return routes;
  }
}