"use strict";

function AboutConfigClient(document) {
  this.document = document;
};

AboutConfigClient.prototype.byId = function(elementId) {
  return this.document.getElementById(elementId);
}

AboutConfigClient.prototype.clickAt = function(elementId, context) {
  var element = this.byId(elementId);
  var rect = element.getBoundingClientRect();
  return EventUtils.synthesizeMouse(
    context,
    rect.x + 2,
    rect.y + 2,
    {}
  );
};

AboutConfigClient.prototype.getTree = function() {
  return this.byId('configTree');
};

AboutConfigClient.prototype.getTreeGlobal = function() {
  return this.getTree().ownerGlobal;
};

AboutConfigClient.prototype.getTreeBody = function() {
  return this.byId('configTreeBody');
};

AboutConfigClient.prototype.getTreeBoxObject = function() {
  return this.getTree().treeBoxObject;
};

AboutConfigClient.prototype.getTreeView = function() {
  return this.getTreeBoxObject().view;
};

AboutConfigClient.prototype.getTreeViewSelection = function() {
  return this.getTreeView().selection;
};

AboutConfigClient.prototype.getContextMenu = function() {
  return this.byId('configContext');
};

AboutConfigClient.prototype.findRow = function(pref) {
  for (let row of this.getRows()) {
    if (row.pref == pref) {
      return row;
    }
  }
  return false;
};

AboutConfigClient.prototype.getRows = function*() {
  const count = this.getRowCount();
  for (var index = 0; index < count; index++) {
    yield this.getRow(index);
  }
};

AboutConfigClient.prototype.getRowCount = function() {
  return this.getTreeView().rowCount;
};

AboutConfigClient.prototype.getRow = function(index) {
  const tree = this.getTree();
  const treeView = this.getTreeView();
  const treeBox = this.getTreeBoxObject();
  
  const pref = treeView.getCellText(index, {id:'prefCol'});
  const status = treeView.getCellText(index, {id:'lockCol'});
  const type = treeView.getCellText(index, {id:'typeCol'});
  const value = treeView.getCellText(index, {id:'valueCol'});
  const select = () => this.selectPref(pref);
  const selectAndReset = () => select() && this.resetSelected();
  const selectAndModifyOrToggle = () => select() && this.modifySelected();
  const getCoords = () => {
    let coords = treeBox.getCoordsForCellItem(index, tree.columns.prefCol, "cell");
    return coords;
  };
  const openContextMenu = () => {
    select();
    
    var rect = getCoords();
    
    var bodyRect = this.getTreeBody().getBoundingClientRect();
  
    let contextMenuShown = BrowserTestUtils.waitForEvent(
      this.getContextMenu(),
      "popupshown"
    );
    
    let x = rect.x + bodyRect.x;
    let y = rect.y + bodyRect.y;
  
    EventUtils.synthesizeMouse(
      this.getTreeBody(), x, y,
      { type: "contextmenu" }
    );
    
    return contextMenuShown;
  };
  const clickInContextMenu = async (id) => {
    await this.tick();
    console.log("Opening context menu...");
    await openContextMenu();
    console.log("Clicking at " + id + "...");
    return this.clickAt(id, this.getContextMenu());
  }
  const toggleViaContextMenu = async () => clickInContextMenu("toggleSelected");
  const modifyViaContextMenu = async () => clickInContextMenu("modifySelected");
  const resetViaContextMenu = async () => clickInContextMenu("resetSelected");
  const copyViaContextMenu = async () => clickInContextMenu("copyPref");
  const copyNameViaContextMenu = async () => clickInContextMenu("copyName");
  const copyValueViaContextMenu = async () => clickInContextMenu("copyValue");
  
  return { index, pref, status, type, value, openContextMenu,
   toggleViaContextMenu, modifyViaContextMenu, resetViaContextMenu,
   copyViaContextMenu, copyNameViaContextMenu, copyValueViaContextMenu, 
  };
};

AboutConfigClient.prototype.resetSelected = function() {
  this.getTreeGlobal().ResetSelected();
};

AboutConfigClient.prototype.modifySelected = function() {
  this.getTreeGlobal().ModifySelected();
};

AboutConfigClient.prototype.toggleSelected = function() {
  this.getTreeGlobal().ModifySelected();
};

AboutConfigClient.prototype.selectPref = function(pref) {
  const row = this.findRow(pref);
  if (row !== false) {
    this.getTreeViewSelection().select(row.index);
    this.getTreeBoxObject().ensureRowIsVisible(row.index);
    return true;
  } else {
    return false;
  }
};

AboutConfigClient.prototype.closeContextMenu = function() {
  EventUtils.sendKey("ESCAPE", window);
  return this.tick();
};

AboutConfigClient.prototype.tick = function() {
  return this.wait(0);
};

AboutConfigClient.prototype.wait = function(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
};

function checkContextMenu(aContextMenu, aExpectedEntries, aWindow = window) {
  let childNodes = [...aContextMenu.childNodes];
  // Ignore hidden nodes:
  childNodes = childNodes.filter((n) => !n.hidden);

  for (let i = 0; i < childNodes.length; i++) {
    let childNode = childNodes[i];
    try {
      let entry = aExpectedEntries[i];
      
      if (typeof entry.type != "undefined") {
        is(childNode.localName, entry.type, "Context menu child should match type " + entry.type);
      }
      
      if (typeof entry.selector != "undefined") {
        ok(childNode.matches(entry.selector), "Context menu child should match selector " + entry.selector);
      }

      if (typeof entry.enabled != "undefined") {
        is(childNode.getAttribute("disabled") == "true", !entry.enabled, "Context menu should be " + (entry.enabled ? "enabled" : "disabled"));
      }
    } catch (e) {
      ok(false, "Exception when checking context menu: " + e);
    }
  }
}

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
