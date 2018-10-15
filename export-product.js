/* eslint-disable no-console */
const AskKodiak = require('ask-kodiak-sdk'),
      argv = require('yargs').argv, //command line arguments
      Json2csvParser = require('json2csv').Parser, //json to csv library
      fs = require('fs'), //for writing the file
      file = 'output.csv'; // name of file

var precision = 'national-industry';

// test for required arguments
if (!argv.key) {
  console.log('an api key is required.');
  process.exit();
}
if (!argv.gid) {
  console.log('an api group id (gid) is required.');
  process.exit();
}
if (!argv.pid) {
  console.log('a product id (pid) is required.');
  process.exit();
}

// does the work of turning the data into a CSV once it's an array of rows
function rows2csv(rows) {
  var fields = ['code', 'description', 'eligibility'],
      opts = {fields},
      parser = new Json2csvParser(opts);

  return parser.parse(rows);
}

// init the Ask Kodiak SDK with the keys provided.
AskKodiak.init(argv.gid, argv.key);

AskKodiak.getEligibilityByNaicsGroupType(argv.pid, precision).then(function (eligibility) {
  // default eligibility as an empty object just in case there is none for the product.
  eligibility = eligibility || {};

  AskKodiak.getNaicsSummaryForGroupType(precision).then(function (naicsTypeSummary) {
    var codes = Object.keys(naicsTypeSummary),
        rows = [];

    codes.forEach(function (code) {
      var eligibilityForCode = eligibility[code] || {},
          coverage = ((eligibilityForCode.coverage || 0) * 100) + '%';

      rows.push({
        code: code,
        description: naicsTypeSummary[code],
        eligibility: coverage
      });
    });

    fs.writeFile(file, rows2csv(rows), function (error) {
      if (error) {
        console.error(error);
        process.exit();
      }
      console.log('file saved as ' + file);
      process.exit();
    });

  }).catch(function (error) {
    console.error(error);
    process.exit();
  });
}).catch(function (error) {
  console.log(error);
  process.exit();
});
