#!/usr/bin/env node
/*jshint laxcomma:true, loopfunc:true, asi:true */

var fs = require('fs')
var log = console.log
console.debug = log

var MINUTE = 1000 * 60
  , HOUR = MINUTE * 60
  , DAY = HOUR * 24
  , WEEK = DAY * 7
  , MONTH = DAY * 31
  , YEAR = DAY * 365

module.exports = {

  // settings
  startDate: new Date(0),
  endDate: new Date(DAY),
  resolution: MINUTE * 20,
  headerDistance: 4,
  headerType: 'Minute',

  MINUTE: MINUTE,
  HOUR: HOUR,
  DAY: DAY,
  WEEK: WEEK,
  MONTH: MONTH,
  YEAR: YEAR,

  createJobs: function (lines) {
    return lines.filter(function (line) {
      return !line.match(/\s*#/) && !!line.trim() && !line.match(/^[a-zA-Z0-9]+=/)
    }).map(function (line) {
      return new Job(line.trim())
    });
  },

  renderHeader: function () {
    var start = this.startDate.getTime()
    var end = this.endDate.getTime()
    var line = ''
    var date = new Date();
    for (var m = start; m < end; m += this.resolution * this.headerDistance) {
      date.setTime(m)
      if (this.headerType == 'DayOfWeek') {
        unit = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getUTCDay()]
      } else {
        unit = date['getUTC' + this.headerType]()
      }
      line += unit + new Array(this.headerDistance - String(unit).length + 1).join(' ')
    }
    return line
  },

  renderLine: function (job) {
    var line = ''
    var start = this.startDate.getTime()
    var end = this.endDate.getTime()
    var date = new Date();
    for (var p = start; p < end; p += this.resolution) {
      var runs = false
      for (var m = p; m < p + this.resolution; m += MINUTE) {
        date.setTime(m)
        if (job.isStartDate(date)) {
          runs = true
          break
        }
      }
      line += runs ? '*' : '-'
    }
    return line
  },

  Job: Job


}


// render header
/*
process.stdout.write('\033[7m');
var m = 0;
while (m < (DAY / MINUTE)) {
  var startOfHour = m % 60 === 0;
  var output = (
    startOfHour ? 
    (m / 60).toString() : 
    ' '
  );
  process.stdout.write(output);
  m += output.length * scale;
}
process.stdout.write('\033[0m');
process.stdout.write('\n');
*/

// render jobs
/*
for (j = 0; j < jobs.length; j++) {
  for (m = 0; m < table[j].length; m += scale) {
    var startOfHour = m % 60 === 0;
    if (startOfHour) {
      process.stdout.write('\033[40m');
    }

    var run = table[j].slice(m, m + scale).reduce(function (prev, curr) {
      return prev += curr;
    }, 0);
    if (run > 9) {
      run = '*';
    }
    process.stdout.write(run ? '*' : '─');

    if (startOfHour) {
      process.stdout.write('\033[0m');
    }
  }  
  process.stdout.write(' (' + jobs[j].line + ')');
  process.stdout.write('\n');
}
*/

function Job(line) {
  this.line = line;
  var matches = 
    this.line.match('([^\\s]+)\\s+([^\\s]+)\\s+([^\\s]+)\\s+([^\\s]+)\\s+([^\\s]+)\\s+(.+)$');
  if (!matches) {
    throw new Error("No matches for line: " + this.line);
  }
  this.minutes     = parse(matches[1], {from: 0, to: 59});
  this.hours       = parse(matches[2], {from: 0, to: 23});
  this.daysOfMonth = parse(matches[3], {from: 1, to: 31});
  this.months      = parse(matches[4], {from: 1, to: 12});
  this.daysOfWeek  = parse(matches[5], {from: 0, to:  6});
  this.command = matches[6];
  
  var daysOfMonthPattern = matches[3];
  var daysOfWeekPattern = matches[5];
  if (daysOfMonthPattern != '*' && daysOfWeekPattern == '*') {
    this.daysOfWeek = []
  }
  if (daysOfWeekPattern != '*' && daysOfMonthPattern == '*') {
    this.daysOfMonth = []
  }

  this.shortName = function () {
    var commandWithoutRedirection = this.command.replace(/ *[12]?\>.*$/, '');
    var chunks = commandWithoutRedirection.split('/');
    return chunks.pop();
  }

  this.isStartDate = function (date) {
    if (this.months.indexOf(date.getUTCMonth() + 1) == -1) {
      return false;
    }
    if (this.daysOfMonth.indexOf(date.getUTCDate()) == -1 &&
        this.daysOfWeek.indexOf(date.getUTCDay()) == -1) {
      return false;
    }
    if (this.hours.indexOf(date.getUTCHours()) == -1) {
      return false;
    }
    if (this.minutes.indexOf(date.getUTCMinutes()) == -1) {
      return false;
    }
    return true;
  };

  function parse (str, range) {
    var result = [], i;
    var chunks = str.split(',');
    chunks.forEach(function (chunk) { 
      if (chunk == '*') {
        for (i = range.from; i <= range.to; i++) {
          result.push(i);
        }
      }
      else if (chunk.match(/^\*\/(\d+)$/)) { // -> */10
        var interval = parseInt(RegExp.$1, 10);
        for (i = range.from; i <= range.to; i += interval) {
          result.push(i)
        }
      }
      else if (chunk.match(/^(\d+)$/)) { // -> 8
        result.push(parseInt(RegExp.$1, 10))
      }
      else if (chunk.match(/^([\d,]+)$/)) { // -> 23,0,1
        var chunks = RegExp.$1.split(',')
        chunks.forEach(function (chunk) { result.push(parseInt(chunk, 10)); })
      }
      else if (chunk.match(/^([\d]+)-([\d]+)$/)) { // -> 06-23
        var from = parseInt(RegExp.$1, 10)
        var to = parseInt(RegExp.$2, 10)
        for (i = from; i <= to; i++) {
          result.push(i)
        }
      }
      else {
        throw new Error("Unsupported pattern: " + str);
      }
    });
    return result;
  }

}
