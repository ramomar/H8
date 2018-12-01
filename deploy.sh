#!/bin/bash

source prod.env

function usage() {
  echo -e "Usage: $0 [--install,--uninstall,--env]"
}

function install() {

  ROOT=$(pwd)

  # Exit if any command fails
  set -e

  echo -e "\n"

  echo "Creating 'H8' package"
  bx wsk package create H8 \
    --param "TIMEZONE" $TIMEZONE \
    --param "COORDINATES" $COORDINATES \
    --param "LANG" $LANG \
    --param "TODOIST_HOST" $TODOIST_HOST \
    --param "TODOIST_TOKEN" $TODOIST_TOKEN \
    --param "WEATHER_HOST" $WEATHER_HOST \
    --param "WEATHER_TOKEN" $WEATHER_TOKEN \
    --param "TELEGRAM_HOST" $TELEGRAM_HOST \
    --param "TELEGRAM_TOKEN" $TELEGRAM_TOKEN \
    --param "TELEGRAM_CHAT_ID" $TELEGRAM_CHAT_ID \
    --param "MONGO_USER" $MONGO_USER \
    --param "MONGO_PASSWORD" $MONGO_PASSWORD \
    --param "MONGO_DATABASE" $MONGO_DATABASE \
    --param "MONGO_COLLECTION" $MONGO_COLLECTION

  echo "Installing tasks-summary action"
  cd actions/tasks-summary
  npm install
  rm *.zip
  zip -rq action.zip *
  bx wsk action create H8/tasks-summary \
    --kind nodejs:8 action.zip
  cd $ROOT

  echo "Installing weather-forecast-summary action"
  cd actions/weather-forecast-summary
  npm install
  rm *.zip
  zip -rq action.zip *
  bx wsk action create H8/weather-forecast-summary \
    --kind nodejs:8 action.zip
  cd $ROOT

  echo "Installing telegram-daily-summary action"
  cd actions/telegram-daily-summary
  npm install
  rm *.zip
  zip -rq action.zip *
  bx wsk action create H8/telegram-daily-summary \
    --kind nodejs:8 action.zip
  cd $ROOT

  echo "Installing banorte-notifications-zapier action"
  cd actions/banorte-notifications-zapier
  npm install
  rm *.zip
  zip -rq action.zip *
  bx wsk action create H8/banorte-notifications-zapier \
    --kind nodejs:8 action.zip
  cd $ROOT

  echo "Installing banorte-mail-handler action"
  cd actions/banorte-mail-handler
  npm install
  rm *.zip
  zip -rq action.zip *
  bx wsk action create H8/banorte-mail-handler \
    --kind nodejs:8 action.zip
    cd $ROOT

  echo -e "Install Complete"
}

function uninstall() {
  echo -e "Uninstalling..."

  echo "Removing actions..."
  bx wsk action delete H8/tasks-summary
  bx wsk action delete H8/weather-forecast-summary
  bx wsk action delete H8/telegram-daily-summary
  bx wsk action delete H8/banorte-notifications-zapier
  bx wsk action delete H8/banorte-mail-handler

  echo "Removing package..."
  bx wsk package delete H8

  echo -e "Uninstall complete"
}

function showenv() {
  echo -e TIMEZONE="$TIMEZONE"
  echo -e COORDINATES="$COORDINATES"
  echo -e LANG="$LANG"
  echo -e TODOIST_HOST="$TODOIST_HOST"
  echo -e TODOIST_TOKEN="$TODOIST_TOKEN"
  echo -e WEATHER_HOST="$WEATHER_HOST"
  echo -e WEATHER_TOKEN="$WEATHER_TOKEN"
  echo -e "TELEGRAM_HOST"=$TELEGRAM_HOST
  echo -e "TELEGRAM_TOKEN"=$TELEGRAM_TOKEN
  echo -e "TELEGRAM_CHAT_ID"=$TELEGRAM_CHAT_ID
  echo -e "MONGO_USER=$MONGO_USER"
  echo -e "MONGO_PASSWORD=$MONGO_PASSWORD"
  echo -e "MONGO_DATABASE=$MONGO_DATABASE"
  echo -e "MONGO_COLLECTION=$MONGO_COLLECTION"
}

case "$1" in
"--install" )
install
;;
"--uninstall" )
uninstall
;;
"--env" )
showenv
;;
* )
usage
;;
esac
