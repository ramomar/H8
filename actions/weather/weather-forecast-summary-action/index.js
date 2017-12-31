const { URL } = require('url');
const request = require('request-promise-native');
const { path, prop, pipe, take, map, zipObj, objOf, always } = require('ramda');

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

function main(params) {
  const forecast = forecastClient(params.WEATHER_HOST, params.WEATHER_TOKEN);

  return forecast(params.COORDINATES, params.LANG)
    .then(parseForecast)
    .catch(always({error: {error: 500}}));
}

module.exports.main = main;
