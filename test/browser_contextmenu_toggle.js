"use strict";

/**
 * Context menu: toggle preferences and check their value.
 */
add_about_config_test(async function(client) {
  var row = client.findRow("accessibility.AOM.enabled");
  console.log("Toggling...");
  await row.toggleViaContextMenu();
  console.log("Resetting...");
  await row.resetViaContextMenu();
  await client.wait(5000);

  var row = client.findRow("accessibility.typeaheadfind.timeout");
  await row.modifyViaContextMenu();
  await client.wait(1000);
  EventUtils.sendKey("0", window);
  EventUtils.sendKey("RETURN", window);
  await row.resetViaContextMenu();
  await client.wait(1000);
});