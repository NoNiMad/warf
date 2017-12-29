const path = require('path')
const fs   = require('fs')

let warf = {
  config: null,
  modules: [],
  loadConfig(fullPath) {
    if (fullPath === undefined) {
      fullPath = path.join(process.cwd(), 'config')
    }
  
    let config = {}
    let configFiles = fs.readdirSync(fullPath)
    configFiles.forEach(cfg => {
      let loaded = require(path.join(fullPath, cfg))
      let noExt = cfg.substr(0, cfg.length - 3)
      config[noExt] = loaded
    })

    this.config = config
  },
  async loadModules() {
    if (this.config == null)
      this.loadConfig()

    let loaded = []
    
    for (let moduleName in this.config.modules) {
      let module = null
      let value = this.config.modules[moduleName]

      let fail = false

      if (value === true) {
        module = require('./modules/' + moduleName)
      } else if (typeof value === 'string') {
        module = require(value)
      } else if (Array.isArray(value)) {
        for (let dep of value) {
          if (loaded.indexOf(dep) === -1) {
            console.error('Can\'t load module ' + moduleName + ' because of missing dependency: ' + dep)
            fail = true
            break
          }
        }

        module = require('./modules/' + moduleName)
      }

      if (fail) continue

      this.modules.push(await module.init(this.config))
      loaded.push(moduleName)
      console.log('[warf] Module ' + moduleName + ' loaded successfully')
    }
  },
  start() {
    if (this.config == null)
      this.loadConfig()

    const server = require('server')
    const router = server.router
    const reply  = server.reply

    return server(
      {
        port: this.config.server.port,
        views: this.config.folders.views,
        public: this.config.folders.public
      },
      ctx => {
        ctx.config = this.config
      },
      this.modules,
      router.error(ctx => {
        console.error(ctx.error)
        return reply.status(500).send(ctx.error)
      })
    )
  }
}

module.exports = warf