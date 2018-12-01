const { MongoClient } = require('mongodb');
const cheerio = require('cheerio');

function main(params) {
  const {
    bodyHtml64,
    from,
    date
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

  const URL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@ds131963.mlab.com:31963/${MONGO_DATABASE}`;

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
