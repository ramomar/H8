const { pick } = require('rambda');

function main(params) {
  const extractZapierPayload = pick(['date', 'body_plain', 'from', 'body_html', 'subject']);

  const zapierPayload = extractZapierPayload(params);

  return {
    date: zapierPayload.date,
    from: zapierPayload.from,
    subject: zapierPayload.subject,
    bodyPlain64: Buffer.from(zapierPayload.body_plain).toString('base64'),
    bodyHtml64: Buffer.from(zapierPayload.body_html).toString('base64')
  };
}

if (require.main === module) {
  const params = require('./params.json');
  console.log(main(params));
} else {
  module.exports.main = main;
}
