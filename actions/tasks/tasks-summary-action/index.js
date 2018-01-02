const { URL } = require('url');
const request = require('request-promise');
const {
        map, filter, both, either, prop, props, indexBy, pipe, ifElse, sort,
        path, groupBy, has, always, omit, cond, tap
      } = require('ramda');
const {
        LocalDate, LocalTime, ZonedDateTime, DateTimeFormatter, ZoneId
      } = require('js-joda');

function todoistClient(host, token) {
  return resource => {
    const options = {
      uri: (new URL(resource, host)).href,
      qs: { token: token },
      json: true
    };

    return request(options);
  }
}

function parseProjects(projectsResponse) {
  const indexById = indexBy(prop('id'));
  const mapName = map(prop('name'));
  const makeProjectNameIdMappings = pipe(indexById, mapName);

  return makeProjectNameIdMappings(projectsResponse);
}

function parseTasks(projects, tasksResponse, timezone) {
  const now = LocalDate.now();

  const extractDate = pipe(path(['due', 'date']), LocalDate.parse);

  const extractTentativeDueDate = (function () {
    const extractDateWithDefaultTime = pipe(
      path(['due', 'date']),
      LocalDate.parse,
      ld => ZonedDateTime.of(ld, LocalTime.MAX, ZoneId.of(timezone))
    );

    const extractDateTime = pipe(
      path(['due', 'datetime']),
      dt => ZonedDateTime
        .parse(dt, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssVV"))
        .withZoneSameInstant(ZoneId.of(timezone))
    )

    return ifElse(
      pipe(prop('due'), has('datetime')),
      extractDateTime,
      extractDateWithDefaultTime
    );
  })();

  const dueDateOrdering = (t1, t2) =>
    extractTentativeDueDate(t1).compareTo(extractTentativeDueDate(t2));

  const isDueForTodayOrOverdue = pipe(
    extractDate,
    either(
      d => d.equals(now),
      d => d.isBefore(now)
    )
  );

  const dueOrOverdue = pipe(
    extractDate,
    cond([
      [d => d.isBefore(now), always('overdue')],
      [d => d.equals(now), always('due')]
    ])
  );

  const makeTaskSummary = task => ({
    project: projects[prop('project_id', task)],
    content: prop('content', task),
    due: omit(['string', 'recurring'], prop('due', task)),
    url: prop('url', task)
  });

  const makeTasksSummary = pipe(
    filter(both(has('due'), isDueForTodayOrOverdue)),
    sort(dueDateOrdering),
    groupBy(dueOrOverdue),
    map(map(makeTaskSummary)),
    map(groupBy(prop('project')))
  );

  return makeTasksSummary(tasksResponse);
}

const handleError = pipe(
  console.error,
  always({error: 500})
);

function logResponses(responses) {
  responses.forEach(r => console.info(r));
}

function main(params) {
  const todoist = todoistClient(params.TODO_HOST, params.TODO_TOKEN)
  const combineResponses = ([projects, tasks]) =>
    parseTasks(parseProjects(projects), tasks, params.TIMEZONE)

  return Promise.all([todoist('projects'), todoist('tasks')])
    .then(tap(logResponses))
    .then(combineResponses)
    .catch(handleError);
}

module.exports.main = main;
