const { URL } = require('url');
const request = require('request-promise-native');
const { path, prop, pipe, take, map, zipObj, objOf } = require('ramda');

const HOST = 'https://api.wunderground.com/api/';

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
      uri: new URL(path, HOST).href,
      json: true
    };

    return rp(options);
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
    ['startOfDaySummary', 'endOfDaySummary'],
    extractForecasts(forecastResult)
  );
}

function main(params) {
  const forecast = forecastClient(params.WEATHER_HOST, params.WEATHER_TOKEN);

  return forecast(params.COORDINATES, params.LANG)
    .then(parseForecast)
    .then(JSON.stringify)
    .catch(objOf('error'));
}

module.exports = main;
