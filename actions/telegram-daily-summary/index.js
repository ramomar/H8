const request = require('request-promise');
const openwhisk = require('openwhisk');
const { LocalDate } = require('js-joda');
const { tap, pipe, always, prop, path, map } = require('ramda');

function telegramClient(host, token, chatId) {
  function sendMessage(text) {
    const path = [
      `bot${token}`,
      'sendMessage'
    ].join('/');

    const body = {
      'chat_id': chatId,
      'text': text,
      'parse_mode': 'Markdown'
    };

    const options = {
      method: 'POST',
      uri: `${host}${path}`, // URL module won't create correct uri
      json: true,
      body
    };

    return request(options);
  }

  return {
    sendMessage
  };
}

const handleErrors = pipe(
  console.error,
  always({ error: 500 })
);

function logResponses(responses) {
  responses.forEach(r => console.info(r));
}

function formatTasksSummary(tasksSummary) {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr',
    'May', 'Jun', 'Jul', 'Ago',
    'Sep', 'Oct', 'Nov', 'Dic'
  ];

  function taskFormat(task) {
    const date = LocalDate.parse(path(['due', 'date'])(task));
    const day = date.dayOfMonth();
    const month = date.monthValue();
    const content = prop('content')(task);

    return `_${content} ${months[month-1]} ${day}_`;
  }

  const makeFormattedTasks = pipe(
    prop('due'),
    map(taskFormat)
  );

  return [].concat(
    `*Tareas para hoy* ✅`,
    makeFormattedTasks(tasksSummary)
  ).join('\n');
}

function formatWeatherSummary(weatherSummary) {
  const weatherStartOfDay = path(['startOfDay', 'description']);
  const weatherEndOfDay = path(['endOfDay', 'description']);

  return [
    '*Inicio del día* 🌅',
    `_${weatherStartOfDay(weatherSummary)}_`,
    '*Fin del día* 🌇',
    `_${weatherEndOfDay(weatherSummary)}_`
  ].join('\n');
}

function makeDailySummary(responses) {
  const [tasks, weather] = responses;

  const tasksSummary = formatTasksSummary(tasks);
  const weatherSummary = formatWeatherSummary(weather);

  return [
    weatherSummary,
    tasksSummary
  ].join('\n');
} 

function main(params) {
  const {
    TELEGRAM_HOST,
    TELEGRAM_TOKEN,
    TELEGRAM_CHAT_ID
  } = params;

  const ow = openwhisk({ ignore_certs: true });
  
  const tasksAction = {
    actionName: 'gauss/tasks-summary',
    result: true,
    blocking: true
  };

  const weatherAction = {
    actionName: 'gauss/weather-forecast-summary',
    result: true,
    blocking: true
  };

  const sendMessage = telegramClient(
    TELEGRAM_HOST,
    TELEGRAM_TOKEN,
    TELEGRAM_CHAT_ID
  ).sendMessage;
  
  return Promise.all([
    ow.actions.invoke(tasksAction),
    ow.actions.invoke(weatherAction)
  ])
    .then(tap(logResponses))
    .then(makeDailySummary)
    .then(sendMessage)
    .catch(handleErrors);
}

module.exports.main = main;

