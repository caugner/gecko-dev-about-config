"use strict";

const DEFAULT_BOOL_PREF = "general.autoScroll";
const DEFAULT_CHAR_PREF = "general.useragent.locale";
const DEFAULT_INT_PREF = "general.config.obscure_value";

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

async function disableAboutConfigWarning()
{
  await SpecialPowers.pushPrefEnv({
    set: [["general.warnOnAboutConfig", false]]
  });
}

async function testInAboutConfig(test) {
  disableAboutConfigWarning();
  await BrowserTestUtils.withNewTab("about:config", async function(browser) {
    const client = new AboutConfigClient(browser.contentDocument);
    await test(client);
  });
}

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

function setupCustomTestPrefs() {
  Services.prefs.setBoolPref("test.bool.false", false);
  Services.prefs.setBoolPref("test.bool.true", true);  

  Services.prefs.setCharPref("test.char.empty", "");
  Services.prefs.setCharPref("test.char.foo", "foo");

  Services.prefs.setIntPref("test.int.minus", -1);
  Services.prefs.setIntPref("test.int.plus", 1);
  Services.prefs.setIntPref("test.int.zero", 0);
};

function add_about_config_test(asyncFunction) {
  add_task(async function() {
    setupCustomTestPrefs();

    await testInAboutConfig(asyncFunction);
  });
};