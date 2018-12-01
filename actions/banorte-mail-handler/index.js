const { MongoClient } = require('mongodb');
const cheerio = require('cheerio');

function main(params) {
  const {
    bodyHtml64,
    from,
    date,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_USER,
    MONGO_PASSWORD,
    MONGO_DATABASE,
    MONGO_COLLECTION
  } = params;

  const html = Buffer.from(bodyHtml64, 'base64').toString();

  const $ = cheerio.load(html);

  const fields = $('td')
      .map((idx, elem) => $(elem).text().trim())
      .get()
      .filter(field => field.length > 0);

  const record = {
    account: (/\d+/).exec(fields[0])[0],
    date: date,
    note: fields[2],
    amount: parseFloat((/\d+\.\d+/).exec(fields[9])[0]),
    category: from
  };

  const URL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;

  const client = new MongoClient(URL);

  return client.connect().then(_ =>
      client
        .db(MONGO_DATABASE)
        .collection(MONGO_COLLECTION)
        .insertOne(record)
        .then(result => {
          client.close();
          return result;
        })
  );
}

if (require.main === module) {
  const params = require('./params.json');
  main(params).then(console.log);
} else {
  module.exports.main = main;
}
