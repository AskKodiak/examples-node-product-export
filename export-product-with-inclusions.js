/* eslint-disable no-console */
const AskKodiak = require('ask-kodiak-sdk'),
      argv = require('yargs').argv, //command line arguments
      Json2csvParser = require('json2csv').Parser, //json to csv library
      fs = require('fs'), //for writing the file
      file = 'output-with-inclusions.csv'; // name of file

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
  var fields = ['code', 'description', 'eligibility', 'highlights', 'guidelines', 'collateral', 'notes'],
      opts = {fields},
      parser = new Json2csvParser(opts);

  return parser.parse(rows);
}
// NAICS code into it's lineage as an array
function getPathArray(group) {
  var path = [];

  group = group.toString();

  // generally straightforward, but need deal with the
  // hyphens in a few sectors hence the if condition
  // when length is 5
  // Code 31-33 = manufacturing
  // Code 44-45 = Retail
  // Code 48-49 = Transportation & wharehousing
  if (group.length === 2) {
    path = [group];
  } else if (group.length === 3) {
    path = [group.substring(0, 2), group.substring(0, 3)];
  } else if (group.length === 4) {
    path = [group.substring(0, 2), group.substring(0, 3), group.substring(0, 4)];
  } else if (group.length === 5) {
    //catch the hyphenated sectors
    if (group.indexOf('-') > -1) {
      path = [group];
    } else {
      path = [group.substring(0, 2), group.substring(0, 3), group.substring(0, 4), group.substring(0, 5)];
    }
  } else if (group.length === 6) {
    path = [group.substring(0, 2), group.substring(0, 3), group.substring(0, 4), group.substring(0, 5), group.substring(0, 6)];
  } else {
    return [];
  }

  // hyphenate those classes that are in the shared sectors
  if (path[0] > 30 && path[0] < 34) {
    path[0] = '31-33';
  }
  if (path[0] > 43 && path[0] < 46) {
    path[0] = '44-45';
  }
  if (path[0] > 47 && path[0] < 50) {
    path[0] = '48-49';
  }

  return path;
}

// init the Ask Kodiak SDK with the keys provided.
AskKodiak.init(argv.gid, argv.key);

AskKodiak.getProduct(argv.pid).then(function (product) {
  var rules = product.conditionalRules || {},
      ruleIds = Object.keys(rules),
      hasRulesFor = {};

  // examine rules to see what naics groups (if any) they hang off of.
  ruleIds.forEach(function (id) {
    var rule = rules[id],
        when = rule.when || {},
        naicsGroups = when['naics-groups'] || [];

    //index rules by NAICS Group. we'll use this later.
    naicsGroups.forEach(function (groupNum) {
      hasRulesFor[groupNum] = hasRulesFor[groupNum] || {ids: {}};
      hasRulesFor[groupNum].ids[id] = true;
    });

  });

  // go get the eligibility for this product at the specified level of precision
  AskKodiak.getEligibilityByNaicsGroupType(argv.pid, precision).then(function (eligibility) {
    // default eligibility as an empty object just in case there is none for the product.
    eligibility = eligibility || {};
    AskKodiak.getNaicsSummaryForGroupType(precision).then(function (naicsTypeSummary) {
      var codes = Object.keys(naicsTypeSummary),
          rows = [];

      codes.forEach(function (code) {
        var eligibilityForCode = eligibility[code] || {},
            coverage = ((eligibilityForCode.coverage || 0) * 100) + '%',
            highlights = '',
            guidelines = '',
            collateral = '',
            notes = '',
            lineage = getPathArray(code); //all the naics groups in this groups ancestry

        // round up included content for this group number or any of it's ancestors and apply them
        lineage.forEach(function (groupNum) {
          var rulesFor = hasRulesFor[groupNum] || {},
              ruleIds = Object.keys(rulesFor.ids || {});

          ruleIds.forEach(function (ruleId) {
            var rule = rules[ruleId],
                include = rule.include || {},
                inclCollateral = include.collateral || [],
                inclGuidelines = include.guidelines || [],
                inclHighlights = include.highlights || [],
                inclNotes = include.notes || [];

            inclCollateral.forEach(function (item) {
              collateral += ('\n' + item.description + ' ' + item.link);
            });

            inclGuidelines.forEach(function (item) {
              guidelines += ('\n' + item);
            });

            inclHighlights.forEach(function (item) {
              highlights += ('\n' + item);
            });

            inclNotes.forEach(function (item) {
              notes += ('\n' + item);
            });

          });

        });

        rows.push({
          code: code,
          description: naicsTypeSummary[code],
          eligibility: coverage,
          highlights: highlights,
          guidelines: guidelines,
          collateral: collateral,
          notes: notes
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
}).catch(function (error) {
  console.error(error);
  process.exit();
});
