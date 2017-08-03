"use strict";

add_task(async function() {
  // Avoid about:config warning.
  await SpecialPowers.pushPrefEnv({
    set: [["general.warnOnAboutConfig", false]]
  });
  
  const DEFAULT_BOOL_PREF = "general.autoScroll";
  const DEFAULT_CHAR_PREF = "general.useragent.locale";
  const DEFAULT_INT_PREF = "general.config.obscure_value";
  
  // Set custom preferences.
  Services.prefs.setBoolPref("test.bool.false", false);
  Services.prefs.setBoolPref("test.bool.true", true);  
  
  Services.prefs.setCharPref("test.char.empty", "");
  Services.prefs.setCharPref("test.char.foo", "foo");

  Services.prefs.setIntPref("test.int.minus", -1);
  Services.prefs.setIntPref("test.int.plus", 1);
  Services.prefs.setIntPref("test.int.zero", 0);

  // if you need default prefs:
  // Services.prefs.getDefaultBranch("").setBoolPref("prefname", false);
  // setIntPref/getIntPref ; setCharPref/getCharPref for numeric / string prefs.

  // Open about:config.
  await BrowserTestUtils.withNewTab("about:config", async function(browser) {
    const client = new AboutConfigClient(browser.contentDocument);
    
    // A. Check view.
    let expectedRows = [{
        pref: "test.bool.false",
        status: "modified",
        type: "boolean",
        value: "false"
      },{
        pref: "test.bool.true",
        status: "modified",
        type: "boolean",
        value: "true"
      },{
        pref: "test.char.empty",
        status: "modified",
        type: "string",
        value: ""
      },{
        pref: "test.char.foo",
        status: "modified",
        type: "string",
        value: "foo"
      },{
        pref: "test.int.minus",
        status: "modified",
        type: "integer",
        value: "-1"
      },{
        pref: "test.int.plus",
        status: "modified",
        type: "integer",
        value: "1"
      },{
        pref: "test.int.zero",
        status: "modified",
        type: "integer",
        value: "0"
      }
    ];

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
    
    // B. Check context menu.
    
    // B1. Check context menu content.
    const contextMenuChecks = [{
      // - user-defined boolean.
      pref: "test.bool.false",
      entries: [
        {type: "menuitem", selector: "#toggleSelected", enabled: true},
        {type: "menuseparator"},
        {type: "menuitem", selector: "#copyPref", enabled: true},
        {type: "menuitem", selector: "#copyName", enabled: true},
        {type: "menuitem", selector: "#copyValue", enabled: true},
        {type: "menu"},
        {type: "menuitem", selector: "#resetSelected", enabled: true},
      ]
    },{
      // - user-defined integer.
      pref: "test.int.zero",
      entries: [
        {type: "menuitem", selector: "#modifySelected", enabled: true},
        {type: "menuseparator"},
        {type: "menuitem", selector: "#copyPref", enabled: true},
        {type: "menuitem", selector: "#copyName", enabled: true},
        {type: "menuitem", selector: "#copyValue", enabled: true},
        {type: "menu"},
        {type: "menuitem", selector: "#resetSelected", enabled: true},
      ]
    },{
      // - user-defined string.
      pref: "test.char.foo",
      entries: [
        {type: "menuitem", selector: "#modifySelected", enabled: true},
        {type: "menuseparator"},
        {type: "menuitem", selector: "#copyPref", enabled: true},
        {type: "menuitem", selector: "#copyName", enabled: true},
        {type: "menuitem", selector: "#copyValue", enabled: true},
        {type: "menu"},
        {type: "menuitem", selector: "#resetSelected", enabled: true},
      ]
    },{
      // - default boolean.
      pref: DEFAULT_BOOL_PREF,
      entries: [
        {type: "menuitem", selector: "#toggleSelected", enabled: true},
        {type: "menuseparator"},
        {type: "menuitem", selector: "#copyPref", enabled: true},
        {type: "menuitem", selector: "#copyName", enabled: true},
        {type: "menuitem", selector: "#copyValue", enabled: true},
        {type: "menu"},
        {type: "menuitem", selector: "#resetSelected", enabled: false},
      ]
    },{
      // - default integer.
      pref: DEFAULT_INT_PREF,
      entries: [
        {type: "menuitem", selector: "#modifySelected", enabled: true},
        {type: "menuseparator"},
        {type: "menuitem", selector: "#copyPref", enabled: true},
        {type: "menuitem", selector: "#copyName", enabled: true},
        {type: "menuitem", selector: "#copyValue", enabled: true},
        {type: "menu"},
        {type: "menuitem", selector: "#resetSelected", enabled: false},
      ]
    },{
      // - default string.
      pref: DEFAULT_CHAR_PREF,
      entries: [
        {type: "menuitem", selector: "#modifySelected", enabled: true},
        {type: "menuseparator"},
        {type: "menuitem", selector: "#copyPref", enabled: true},
        {type: "menuitem", selector: "#copyName", enabled: true},
        {type: "menuitem", selector: "#copyValue", enabled: true},
        {type: "menu"},
        {type: "menuitem", selector: "#resetSelected", enabled: false},
      ]
    }];
    
    for (let {pref, entries} of contextMenuChecks) {
      await client.findRow(pref).openContextMenu();
      checkContextMenu(client.getContextMenu(), entries);
    }
    
    // B2. Check context menu functionality (WIP).
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
  
  // C. Resetting preferences without context menu.
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
