"use strict";

/**
 * Context menu: modify preferences and check their value.
 */
add_about_config_test(async function(client) {
  var row = client.findRow("accessibility.typeaheadfind.timeout");
  await row.modifyViaContextMenu();
  await client.wait(1000);
  EventUtils.sendKey("0", window);
  EventUtils.sendKey("RETURN", window);
  await row.resetViaContextMenu();
  await client.wait(1000);
});
