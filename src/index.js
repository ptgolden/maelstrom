"use strict";

var React = require('react')
  , ReactDOM = require('react-dom')
  , Main = require('./components/main')

ReactDOM.render(
  React.createElement(Main),
  document.getElementById('main'));
