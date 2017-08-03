"use strict";

/**
 * API: reset preferences and check their value.
 */
add_about_config_test(async function(client) {
  for (let expectedRow of expectedRows) {
    let pref = expectedRow.pref;
    let type = expectedRow.type;
    let row = client.findRow(pref);
    row.selectAndReset();
    let value;
    try {
      if (type == 'boolean') {
        value = Services.prefs.getBoolPref(pref);
      } else if (type == 'string') {
        value = Services.prefs.getCharPref(pref);
      } else if (type == 'integer') {
        value = Services.prefs.getIntPref(pref);
      }
      ok(typeof value === 'undefined', 'Reset custom pref should remove it.')
    } catch (e) {
      ok(true, 'Reset custom pref should remove it.');
    }
  }
});