/*jshint asi:true */
var assert = require('assert')
var cronshow 

beforeEach(function () {
  var modulePath = require.resolve('../lib/cronshow')
  require.cache[modulePath] = null
  cronshow = require(modulePath)
})

test('comment lines', function () {
  assert.equal(2, cronshow.createJobs([
    '* * * * * yada yada',
    '# comment',
    '*/20 * * * * jiggi yada'
  ]).length)
})

test('resolution + endDate', function () {
  cronshow.endDate = new Date(cronshow.HOUR)
  cronshow.resolution = cronshow.MINUTE * 10 
  var job = new cronshow.Job('*/20 * * * * jiggi yada')
  assert.equal('*-*-*-', cronshow.renderLine(job))
})

test('comma + range', function () {
  var job = new cronshow.Job('0 00,06-23 * * * yiba')
  var expected = [0, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  assert.deepEqual(expected, job.hours)
})

test('render header', function () {
  cronshow.endDate = new Date(cronshow.HOUR / 2)
  cronshow.resolution = cronshow.MINUTE * 2.5  
  cronshow.headerType = 'Minutes'
  cronshow.headerDistance = 4
  assert.equal('0   10  20  ', cronshow.renderHeader())
})

test('short title', function () {
  cronshow.endDate = new Date(cronshow.HOUR / 2)
  cronshow.resolution = cronshow.MINUTE * 2.5  
  cronshow.headerType = 'Minute'
  cronshow.headerDistance = 4
  var job = new cronshow.Job('* * * * * apache php /bla/bli.php > /dev/null')
  assert.equal('bli.php', job.shortName())
})





