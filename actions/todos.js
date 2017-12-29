const { URL } = require('url');
const rp = require('request-promise-native');
const {
        map, filter, both, either, prop, props, indexBy, pipe, identity, ifElse,
        sort, path, groupBy, has, always, omit, cond
      } = require('ramda');
const {
        LocalDate, LocalTime, ZonedDateTime, DateTimeFormatter, ZoneId
      } = require('js-joda');

const DEFAULT_TIMEZONE = 'UTC-06:00';
const HOST = ???;
const TOKEN = ???;

function todoist(resource) {
  const options = {
    uri: (new URL(resource, HOST)).href,
    qs: { token: TOKEN },
    json: true
  };

  return rp(options);
}

function parseProjects(projectsResponse) {
  const indexById = indexBy(prop('id'));
  const mapName = map(prop('name'));
  const makeProjectNameIdMappings = pipe(indexById, mapName);

  return makeProjectNameIdMappings(projectsResponse);
}

function parseTasks(projects, tasksResponse) {
  const now = LocalDate.now();

  const extractDate = pipe(path(['due', 'date']), LocalDate.parse);

  const extractDateWithDefaultTime = pipe(
    path(['due', 'date']),
    LocalDate.parse,
    ld => ZonedDateTime.of(ld, LocalTime.MAX, ZoneId.of(DEFAULT_TIMEZONE))
  );

  const extractDateTime = pipe(
    path(['due', 'datetime']),
    dt => ZonedDateTime
      .parse(dt, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssVV"))
      .withZoneSameInstant(ZoneId.of(DEFAULT_TIMEZONE))
  );

  const extractDueDate = ifElse(
    pipe(prop('due'), has('datetime')),
    extractDateTime,
    extractDateWithDefaultTime
  );

  const dueDateOrdering = (t1, t2) =>
    extractDueDate(t1).compareTo(extractDueDate(t2));

  const isDueForTodayOrOverdue = pipe(
    extractDate,
    either(
      d => d.equals(now),
      d => d.isBefore(now)
    )
  );

  const taskSummary = task =>
    identity({
      project: projects[prop('project_id', task)],
      content: prop('content', task),
      due: omit(['string', 'recurring'], prop('due', task)),
      url: prop('url', task)
    });

  const dueOrOverdue = pipe(
    extractDate,
    cond([
      [d => d.isBefore(now), always('overdue')],
      [d => d.equals(now), always('due')]
    ])
  );

  const makeTasksSummary = pipe(
    filter(both(has('due'), isDueForTodayOrOverdue)),
    sort(dueDateOrdering),
    groupBy(dueOrOverdue),
    map(map(taskSummary)),
    map(groupBy(prop('project')))
  );

  return makeTasksSummary(tasksResponse);
}

function main() {
  const combineResponses = ([projects, tasks]) =>
    parseTasks(parseProjects(projects), tasks)

  return Promise.all([todoist('projects'), todoist('tasks')])
    .then(combineResponses)
    .then(JSON.stringify)
    .catch(console.error);
}
