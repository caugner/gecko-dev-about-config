"use strict";

/**
 * Context menu: open it and its items.
 */
add_about_config_test(async function(client) {
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
});
