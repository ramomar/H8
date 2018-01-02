const { URL } = require('url');
const request = require('request-promise');
const { path, prop, pipe, take, map, zipObj, always, tap } = require('ramda');

function forecastClient(host, token) {
  return (coordinates, lang) => {
    const path = [
      token,
      'forecast',
      `lang:${lang}`,
      'q',
      `${coordinates}.json`,
    ].join('/');

    const options = {
      uri: new URL(path, host).href,
      json: true
    };

    return request(options);
  }
}

function parseForecast(forecastResult) {
  const makeForecastSummary = forecast => ({
    title: prop('title', forecast),
    description: prop('fcttext_metric', forecast)
  });

  const extractForecasts = pipe(
    path(['forecast', 'txt_forecast', 'forecastday']),
    take(2),
    map(makeForecastSummary)
  );

  return zipObj(
    ['startOfDay', 'endOfDay'],
    extractForecasts(forecastResult)
  );
}

const handleError = pipe(
  console.error,
  always({error: 500})
);

function main(params) {
  const forecast = forecastClient(params.WEATHER_HOST, params.WEATHER_TOKEN);

  return forecast(params.COORDINATES, params.LANG)
    .then(tap(console.info))
    .then(parseForecast)
    .catch(handleError);
}

module.exports.main = main;
