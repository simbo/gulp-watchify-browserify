'use strict';

global.jQuery = require('jquery');
global.$ = global.jQuery;

var onDomReady = require('functions/on-dom-ready');

$(document).ready(onDomReady);
