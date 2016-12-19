#!/usr/bin/env node

require('shelljs/global');
var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');

var filename = __filename.replace(__dirname + '/', '');
var elmTest = path.join(__dirname, '..', 'bin', 'elm-test');

function run(testFile) {
  var logFile = 'elm-test.test.log';
  var retVal;

  if (!testFile) {
    retVal = exec(elmTest);
  } else {
    logFile = testFile + '.test.log';
    retVal = exec(elmTest + ' '+ testFile);
  }

  retVal.toEnd(logFile);
  return retVal.code;
}

function assertTestFailure(testFile) {
  var code = run(testFile);
  if (code !== 1) {
    exec('echo ' + filename + ': ERROR: ' + (testFile ? testFile + ': ' : '') + 'Expected tests to fail >&2');
    exit(1);
  }
}

function assertTestSuccess(testFile) {
  var code = run(testFile);
  if (code !== 0) {
    exec('echo ' + filename + ': ERROR: ' + (testFile ? testFile + ': ' : '') + 'Expected tests to pass >&2');
    exit(1);
  }
}

function assertDocTest() {
  var code = exec(elmTest + ' --doctest').code;
  if (code !== 0) {
    exec('Expected doc-tests to pass >&2');
    exit(1);
  }

  sed('-i', /    >>> add 1 2/, '    >>> add 42 42', './DocTestExample.elm');

  code = exec(elmTest + ' --doctest').code;
  if (code !== 1) {
    exec('Expected doc-tests to fail >&2');
    exit(1);
  }

  sed('-i', /    >>> add 42 42/, '    >>> add 1 2', './DocTestExample.elm');
}


echo(filename + ': Installing elm-test...');
exec('npm install --global');

echo(filename + ': Verifying installed elm-test version...');
exec(elmTest + ' --version');

echo(filename + ': Testing examples...');

cd('examples/test');
exec('elm-package install --yes');
assertTestSuccess('suites/PassingTests.elm');
assertTestFailure('suites/FailingTests.elm');
cd('../..');

echo(filename + ': Testing doc-test...');

cd('examples');
assertDocTest();
cd('..');


echo(filename + ': Testing elm-test init...');
rm('-Rf', 'tmp');
mkdir('-p', 'tmp');
cd('tmp');
exec(elmTest + ' init --yes');
cd('test');
// use local node-test-runner
var tmpPackage = fs.readJsonSync('./elm-package.json');
tmpPackage['source-directories'].push('../../src');
var keys = _.reject(_.keys(tmpPackage.dependencies), function(name) {
  return name === "rtfeldman/node-test-runner";
});
tmpPackage.dependencies = _.pick(tmpPackage.dependencies, keys);
fs.writeJsonSync('./elm-package.json', tmpPackage);
exec('elm-package install --yes');
cd('..');
assertTestFailure();

// update failing test to passing test
sed('-i', /should fail/, 'should pass', 'test/suites/Tests.elm');
sed('-i', /Expect.fail "Failed as expected!"/, 'Expect.pass', 'test/suites/Tests.elm');
rm('-Rf', 'test/elm-stuff');
cd('test');
exec('elm-package install --yes');
cd('..');
assertTestSuccess();

cd('..');
rm('-Rf', 'tmp');

echo('');
echo(filename + ': Everything looks good!');
echo('                                                            ');
echo('  __   ,_   _  __,  -/-     ,         __   __   _   ,    ,  ');
echo('_(_/__/ (__(/_(_/(__/_    _/_)__(_/__(_,__(_,__(/__/_)__/_)_');
echo(' _/_                                                        ');
echo('(/                                                          ');
