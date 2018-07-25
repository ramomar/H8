# H8

### Description

H8 is my personal assistant.

Currently H8 is implemented as a set of cloud functions developed for the OpenWhisk platform.

### List of functions

| Name                      | Description  |
|---------------------------|--------------------|
| Todoist Tasks Summary     | Queries the Todoist REST API in order to produce a summary of due and overdue tasks |
| Weather Forecast Summary  | Queries the Wunderground REST API in order to produce a summary of today's weather forecast |
| Telegram Daily Summary    | A Telegram bot that uses the previous actions to produce a daily summary |


### Credentials
Set your own credentials in `template.env` and then rename it to `prod.env`

### Deploying

Run `./deploy.sh`


### H8?

The name H8 refers to a microcontroller, and also, it is a reference to a Muse song called Space Dementia 🚀