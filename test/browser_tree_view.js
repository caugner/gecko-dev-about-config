"use strict";

/**
 * Tree: check its rows.
 */
add_about_config_test(async function(client) {
  // A. Check view.
  for (let expectedRow of expectedRows) {
    let row = client.findRow(expectedRow.pref);
    let prefix = 'Custom pref' + expectedRow.pref + ' should ';
    ok(row !== false, prefix + 'be visible.');
    if (row !== false) {
      for (let field of ['pref', 'status', 'type', 'value']) {
        ok(row[field] == expectedRow[field], prefix + 'have ' + field + ': ' + expectedRow[field]);
      }
    }
  }
});
