module.exports = {
  async init(config) {
    const MongoClient = config.mongo.module.MongoClient

    let mongo = await MongoClient.connect('mongodb://localhost:27017')
    console.log("[mongo] Connected!")

    return ctx => {
      ctx.mongo = mongo
    }
  }
}