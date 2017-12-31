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

  echo "Creating 'gauss' package"
  wsk package create gauss \
    --param "TIMEZONE" $TIMEZONE \
    --param "COORDINATES" $COORDINATES \
    --param "LANG" $LANG \
    --param "TODO_HOST" $TODO_HOST \
    --param "TODO_TOKEN" $TODO_TOKEN \
    --param "WEATHER_HOST" $WEATHER_HOST \
    --param "WEATHER_TOKEN" $WEATHER_TOKEN

  echo "Installing GET tasks-summary action"
  cd actions/tasks/tasks-summary-action
  npm install
  rm *.zip
  zip -rq action.zip *
  wsk action create gauss/tasks-summary \
    --kind nodejs:8 action.zip \
    --web true
  wsk api create -n "Gauss API" /v1 /tasks GET gauss/tasks-summary
  cd $ROOT

  echo "Installing GET weather-forecast-summary action"
  cd actions/weather/weather-forecast-summary-action
  npm install
  rm *.zip
  zip -rq action.zip *
  wsk action create gauss/forecast-summary \
    --kind nodejs:8 action.zip \
    --web true
  wsk api create /v1 /forecast GET gauss/forecast-summary
  cd $ROOT

  echo -e "Install Complete"
}

function uninstall() {
  echo -e "Uninstalling..."

  echo "Removing API actions..."
  wsk api delete /v1

  echo "Removing actions..."
  wsk action delete gauss/tasks-summary
  wsk action delete gauss/forecast-summary

  echo "Removing package..."
  wsk package delete gauss

  echo -e "Uninstall Complete"
}

function showenv() {
  echo -e TIMEZONE="$TIMEZONE"
  echo -e COORDINATES="$COORDINATES"
  echo -e LANG="$LANG"
  echo -e TODO_HOST="$TODO_HOST"
  echo -e TODO_TOKEN="$TODO_TOKEN"
  echo -e WEATHER_HOST="$WEATHER_HOST"
  echo -e WEATHER_TOKEN="$WEATHER_TOKEN"
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
