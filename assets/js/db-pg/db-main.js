/**
 * The Database Search page entry point. The data table is built to display the 
 * eco-interaction records organized by a selected "focus": taxa (grouped further 
 * by view: bat, plant, arthropod), locations, or sources (grouped by either 
 * authors, publications, or publishers). The data map displays interactions
 * geographically. Filtered interactions can be viewed in either form. 
 * 
 * Exports:                 Imported by:
 *     accessTableState         Almost everything else
 *     buildTable               db-ui, filter-panel
 *     initSearchStateAndTable          db_sync, util
 *     resetDataTable           db_sync, db-forms, db-filters, db-tutorial
 *     onLocViewChange          _ui
 *     onSrcViewChange          _ui
 *     onTxnViewChange          _ui
 *     rebuildLocTable          db-filters, save-ints
 *     rebuildTxnTable          db-filters, save-ints
 *     showIntroAndLoadingMsg   db_sync
 *     showLocInDataTable
 *     showLocOnMap
 *
 * CODE SECTIONS:
 *     TABLE STATE OBJ
 *     PAGE INIT
 *     TABLE "STATE"
 *         STATE MANAGMENT
 *     TABLE (RE)BUILD
 *     LOCATION SEARCH
 *         LOCATION TABLE
 *         LOCATION MAP
 *     SOURCE SEARCH
 *     TAXON SEARCH
 */
import * as _alert from '../app/misc/alert-issue.js';
import * as _u from './util/util.js';
import * as data_tree from './table/format-data/data-tree.js';
import * as db_filters from './table/filters/filters-main.js';
import * as db_map from './map/map-main.js';
import * as _ui from './pg-ui/ui-main.js';
import * as _db from './local-data/local-data-main.js';
import * as frmt_data from './table/format-data/aggrid-format.js'; 
import { startWalkthrough } from './tutorial/db-tutorial.js';
import { updateFilterPanelHeader } from './pg-ui/panels/filter-panel.js';

/** ==================== FACADE ============================================= */
export function _util(funcName, params = []) {
    return _u[funcName](...params);
}
export function ui(funcName, params = []) {
    return _ui[funcName](...params);
}
export function db(funcName, params = []) {  
    return _db[funcName](...params);
}
export function resetLocalDb() {
    return _db.resetLocalDb();
}
/* --------------- ERROR HANDLING ------------------------------------------- */
export function alert(funcName, params = []) {
    return _alert[funcName](...params);
}
/** Handles issues without javascript error/exception objects. */
export function alertIssue() {
    return _alert.alertIssue(...arguments);
}
/** Sends Error object to Sentry, issue tracker. */
export function reportErr() {
    return _alert.reportErr(...arguments);
}
/** ==================== TABLE STATE OBJ ==================================== */
/**
 * Stores table state params needed across multiple modules. 
 * {obj} api            Ag-grid API (available after table-init complete)
 * {obj} columnApi      Ag-grid Column API (available after table-init complete)
 * {str} curFocus       Focus of the data in table: taxa, srcs, locs
 * {str} curView        Sub-sort of table data. Eg: bats, auths, etc 
 * {obj} flags          allDataAvailable, tutorialActive
 * {ary} intSet         An array of interactions saved and loaded in the table by the user
 * {ary} openRows       Array of entity ids whose table rows will be expanded on load.
 * {ary} rowData        Row data in table
 * {obj} rcrdsById      Focus records keyed by ID
 * {obj} selectedOpts   K: Combobox key V: value selected 
 * {obj} taxaByLvl      Taxon records in curTree organized by level and keyed under their display name.
 * {str} userRole       Stores the role of the user.
 */
let tState = {};
/** ==================== PAGE INIT ========================================== */
initDbPage();
/** Initializes the UI unless on mobile device.  */
function initDbPage () { 
    if ($(window).width() < 1200 && $('body').data('env') != 'test') { return; } //Popup shown in oi.js
    requireCss();
    requireJs();
    _ui.init();
    //The idb-util.initDb will call @initSearchStateAndTable once local database is ready.
}
/** Loads css files used on the search database page, using Encore webpack. */
function requireCss() {
    require('flatpickr/dist/flatpickr.min.css')
    require('../../styles/css/lib/ag-grid.css');
    require('../../styles/css/lib/theme-fresh.css'); 
    require('../../styles/css/lib/selectize.default.css');
    require('../../styles/css/search_db.css');  
    require('../../styles/css/moz-styles.css');
    require('../../styles/db/db.styl');  
    require('../../styles/db/map.styl');  
    require('../../styles/db/forms.styl');  
}
function requireJs() {
    require('leaflet-control-geocoder');
    require('../libs/selectize.js');
}
/**
 * The first time a browser visits the search page, or when local data is reset,
 * all data is downloaded and stored from the server. The intro-walkthrough is 
 * shown on first visit.
 */ 
export function showIntroAndLoadingMsg(resettingData) {
    _ui.updateUiForDatabaseInit();
    _ui.selectInitialSearchFocus('taxa', resettingData);
    if (resettingData) { return $('#sel-view')[0].selectize.clear('silent'); }
    startWalkthrough('taxa');
}
/** After new data is downlaoded, the search state is initialized and page loaded. */
export function initSearchStateAndTable(focus = 'taxa', isAllDataAvailable = true) {/*Perm-log*/console.log('   *//initSearchStateAndTable. focus? [%s], allDataAvailable ? [%s]', focus, isAllDataAvailable);
    setTableInitState(isAllDataAvailable);      
    _ui.selectInitialSearchFocus(focus);
    buildTable(null, null, isAllDataAvailable)
    .then(updateFilterPanelHeader.bind(null, focus));
} 
function setTableInitState(isAllDataAvailable) {
    resetTableParams('taxa');
    if ($('#shw-chngd')[0].checked) { db_filters.toggleTimeFilter('disable'); }//resets updatedAt table filter
    if (isAllDataAvailable) { tState.flags.allDataAvailable = true; 
    } else { db_filters.clearFilters(); } //Sets default filter status message
}
/* ================== TABLE "STATE" ========================================= */
export function accessTableState() {
    return {
        get: getTableState,
        set: setTableState
    };
}
/** Returns table state to requesting module. */
function getTableState(k, keys) {                                               //console.log('getTableState. params? ', arguments);
    return k && Array.isArray(k) ? getStateObj(k) : k ? tState[k] :
        keys ? getStateObj(keys) : tState;
}
function getStateObj(keys) {
    const obj = {};
    keys.forEach(k => obj[k] = tState[k] || null);                            //console.log('stateObj = %O', obj)
    return obj;
}
function setTableState(stateObj) {                                              //console.log('setTableState. stateObj = %O', stateObj);
    Object.keys(stateObj).forEach(k => { tState[k] = stateObj[k]; })
}
/*---------------------- STATE MANAGMENT -------------------------------------*/
/** Resets on focus change. */
function resetTableParams(focus) {  
    if (focus) { return Promise.resolve(resetTblParams(focus)); }
    return Promise.resolve(_u.getData('curFocus').then(f => resetTblParams(f)));
}
function resetTblParams(focus) {
    const intSet =  tState.intSet;
    const prevApi = tState.api; //will be destroyed before new table loads. Visually jarring to remove before the new one is ready.
    const flags = tState.flags ? tState.flags : {};
    tState = {
        api: prevApi,
        curFocus: focus,
        flags: flags,
        openRows: [],
        selectedOpts: {},
        userRole: $('body').data("user-role")
    };
    if (intSet) { tState.intSet = intSet; }
}
/** Resets storage props, buttons, and filters. */
function resetTableState(onDbInitComplete) {                                                  
    resetCurTreeStorageProps();
    _ui.resetToggleTreeBttn(false);
    if (onDbInitComplete) { return; }
    db_filters.clearFilters();
    db_filters.resetFilterParams();
}
function resetCurTreeStorageProps() {
    delete tState.curTree;
    tState.selectedOpts = {};
}
/* ==================== TABLE (RE)BUILDS ============================================================================ */
function loadTbl(tblName, rowData) {
    return require('./table/init-table.js').default(tblName, rowData, tState);
}
export function reloadTableWithCurrentFilters() {  
    const filters = db_filters.getFilterState();
    db_filters.reloadTableAndApplyFilters(filters);
}
/** 
 * Table-rebuild entry point after local database updates, filter clears, and 
 * after edit-form close.
 */
export function resetDataTable(focus) {                              /*Perm-log*/console.log('   //resetting search table. Focus ? [%s]', focus);
    resetTableState();
    return buildTable(focus)
        .then(_ui.updateUiForTableView);
}
export function buildTable(f, view = false, dbInitComplete) {              
    if (f === '') { return Promise.resolve(); } //Combobox cleared by user
    if (tState.api && !tState.flags.allDataAvailable) { return Promise.resolve(); } //While local database is still initializing.
    const focus = f ? f : _u.getSelVal('Focus');                    /*Perm-log*/console.log("   //select(ing)SearchFocus = [%s], view ? [%s]", focus, view); 
    resetTableState(dbInitComplete);
    return updateFocusAndBuildTable(focus, view);
}
/** Updates the top sort (focus) of the data table: 'taxa', 'locs' or 'srcs'. */
function updateFocusAndBuildTable(focus, view) {                                //console.log("updateFocusAndBuildTable called. focus = [%s], view = [%s", focus, view)
    if (focus === tState.curFocus) { return buildDataTable(focus, view); }                     
    return onFocusChanged(focus, view)
        .then(() => buildDataTable(focus, view));
} 
function onFocusChanged(focus, view) {  
    _u.setData('curFocus', focus);
    _u.setData('curView', view);
    updateFilterPanelHeader(focus);
    $('#focus-filters').empty();  
    return resetTableParams(focus);
}
function buildDataTable(focus, view, fChange) {
    const builders = { 
        'locs': buildLocationTable, 'srcs': buildSourceTable,
        'taxa': buildTaxonTable 
    };  
    return builders[focus](view);
}
export function showTodaysUpdates(focus) {
    db_filters.showTodaysUpdates(focus);
}
/* ==================== LOCATION SEARCH ============================================================================= */
function buildLocationTable(v) {                                    /*Perm-log*/console.log("       --Building Location Table. View ? [%s]", v);
    const view = v || 'tree';
    return _u.getData(['location', 'topRegionNames']).then(beginLocationLoad);
    
    function beginLocationLoad(data) {
        addLocDataToTableParams(data);
        _ui.initLocSearchUi(view);
        return updateLocView(view);
    }
}
function addLocDataToTableParams(data) {
    tState.rcrdsById = data.location;                                    
    tState.data = data;
}
export function onLocViewChange(val) {
    if (!val) { return; }
    updateLocView(val);
}
/** 
 * Event fired when the source view select box has been changed.
 * An optional calback (cb) will redirect the standard map-load sequence.
 */
function updateLocView(v) {                                                     
    const val = v || _u.getSelVal('View');                          /*Perm-log*/console.log('           --updateLocView. view = [%s]', val);
    resetLocUi(val);
    resetTableState();
    _ui.resetToggleTreeBttn(false);
    return showLocInteractionData(val);
}
function resetLocUi(view) { 
    _ui.fadeTable();
    if (view === 'tree') { _ui.updateUiForTableView(); }
}
function showLocInteractionData(view) {                                         //console.log('showLocInteractionData. view = ', view);
    _u.setData('curView', view);                      
    return view === 'tree' ? rebuildLocTable() : buildLocMap();
}
/** --------------- LOCATION TABLE ------------------------------------------ */
/**
 * Rebuilds loc tree with passed location, or the default top regions, as the
 * base node(s) of the new tree with all sub-locations nested beneath @buildLocTree.
 * Resets 'openRows' and clears tree. Continues @buildLocTableTree.
 * Note: This is also the entry point for filter-related table rebuilds.
 */
export function rebuildLocTable(topLoc, textFltr) {                 /*Perm-log*/console.log("       --rebuilding loc tree. topLoc = %O", topLoc);
    const topLocs = topLoc || getTopRegionIds();    
    tState.openRows = topLocs.length === 1 ? topLocs : [];
    _ui.fadeTable();
    return startLocTableBuildChain(topLocs, textFltr);
}
function getTopRegionIds() {
    const ids = [];
    const regions = tState.data.topRegionNames;
    for (let name in regions) { ids.push(regions[name]); } 
    return ids;
}
function startLocTableBuildChain(topLocs, textFltr) {               
    return data_tree.buildLocTree(topLocs, textFltr)
        .then(tree => frmt_data.buildLocRowData(tree, tState))
        .then(rowData => loadTbl('Location Tree', rowData))
        .then(() => _ui.loadLocFilterPanelElems(tState));
}
/** -------------------- LOCATION MAP --------------------------------------- */
/** Filters the data-table to the location selected from the map view. */
export function showLocInDataTable(loc) {                          /*Perm-log*/console.log("       --Showing Location in Table");
    _ui.updateUiForTableView();
    _u.setSelVal('View', 'tree', 'silent');
    rebuildLocTable([loc.id]);
}
/** Initializes the google map in the data table. */
function buildLocMap() {    
    _ui.updateUiForMapView();      
    if (tState.intSet) { return showLocsInSetOnMap(); }
    db_map.initMap(tState.rcrdsById);           
    return Promise.resolve();
}
/**
 * When displaying a user-made set "list" of interactions focused on locations in 
 * "Map Data" view, the locations displayed on the map are only those in the set
 * and their popup data reflects the data of the set. 
 */
function showLocsInSetOnMap() {
    data_tree.buildLocTree(getTopRegionIds())
    .then(getGeoJsonAndShowLocsOnMap);
}
function getGeoJsonAndShowLocsOnMap(tree) { 
    db_map.initMap(tState.rcrdsById, tree);
}
/** Switches to map view and centeres map on selected location. */
export function showLocOnMap(locId, zoom) {                          /*Perm-log*/console.log("       --Showing Location on Map");
    _ui.updateUiForMapView();
    _u.setSelVal('View', 'map', 'silent'); 
    db_map.showLoc(locId, zoom, tState.rcrdsById);
    $('#tbl-filter-status').html('No Active Filters.');
}
/* ==================== SOURCE SEARCH =============================================================================== */
/**
 * Get all data needed for the Source-focused table from data storage and send  
 * to @initSrcSearchUi to begin the data-table build.  
 */
function buildSourceTable(v) {                                      /*Perm-log*/console.log("       --Building Source Table. view ? [%s]", v);
    if (v) { return getSrcDataAndBuildTable(v); }
    return _u.getData('curView', true).then(storedView => {
        const view = storedView || 'pubs';
        return getSrcDataAndBuildTable(view);
    });
}
function getSrcDataAndBuildTable(view) {
    return _u.getData('source').then(srcs => {
        tState.rcrdsById = srcs;
        _ui.initSrcSearchUi(view);
        return startSrcTableBuildChain(view); 
    });
}
/** Event fired when the source view select box has been changed. */
export function onSrcViewChange(val) {                              /*Perm-log*/console.log('       --onSrcViewChange. view ? [%s]', val);
    if (!val) { return; }
    $('#focus-filters').empty();
    return rebuildSrcTable(val);
}
function rebuildSrcTable(val) {                                     /*Perm-log*/console.log('       --rebuildSrcTable. view ? [%s]', val)
    _ui.fadeTable();
    resetTableState();
    _ui.resetToggleTreeBttn(false);
    return startSrcTableBuildChain(val);
}
function startSrcTableBuildChain(val) {
    storeSrcView(val);
    return data_tree.buildSrcTree(tState.curView)
        .then(tree => frmt_data.buildSrcRowData(tree, tState))
        .then(rowData => loadTbl('Source Tree', rowData, tState))
        .then(() => _ui.loadSrcFilterPanelElems(tState.curView));
}
function storeSrcView(val) {  
    const viewVal = val || _u.getSelVal('View');                                //console.log("storeAndReturnCurViewRcrds. viewVal = ", viewVal)
    _u.setData('curView', viewVal);
    tState.curView = viewVal;    
}
/* ==================== TAXON SEARCH  =============================================================================== */
/**
 * Get all data needed for the Taxon-focused table from data storage and send 
 * to @initTaxonSearchUi to begin the data-table build.  
 */
function buildTaxonTable(v) {                                       
    if (v) { return getTxnDataAndBuildTable(v); }
    return _u.getData('curView', true).then(storedView => {
        const view = storedView || getSelValOrDefault(_u.getSelVal('View'));/*Perm-log*/console.log("       --Building [%s] Taxon Table", view);    
        return getTxnDataAndBuildTable(view);
    });
}
function getTxnDataAndBuildTable(view) {
    return _u.getData('taxon').then(beginTaxonLoad.bind(null, view));
}
function beginTaxonLoad(realmId, taxa) {                                                 
    tState.rcrdsById = taxa;                                                    //console.log('Building Taxon Table. taxa = %O', _u.snapshot(taxa));
    const realmTaxon = storeAndReturnRealmRcrd(realmId);
    _ui.initTaxonSearchUi(realmTaxon.id, tState.flags.allDataAvailable);
    return startTxnTableBuildChain(realmTaxon);
}
/** Event fired when the taxon view select box has been changed. */
export function onTxnViewChange(val) {                              /*Perm-log*/console.log('       --onTxnViewChange. [%s]', val)
    if (!val || !tState.flags.allDataAvailable) { return; } //Flag not true when local database is still initializing.
    $('#focus-filters').empty();  
    buildTxnTable(val);
}
function buildTxnTable(val) {                                                   
    const realmTaxon = storeAndReturnRealmRcrd(val);
    resetTableState();
    return rebuildTxnTable(realmTaxon);
}
/**
 * Gets the currently selected taxon realm/view's id, gets the record for the taxon, 
 * stores both it's id and level in the global focusStorage, and returns 
 * the taxon's record.
 */
function storeAndReturnRealmRcrd(val) {
    const realmId = val || getSelValOrDefault(_u.getSelVal('View'));/*debg-log*///console.log('storeAndReturnView. val [%s], realmId [%s]', val, realmId)
    const realmTaxonRcrd = _u.getDetachedRcrd(realmId, tState.rcrdsById, 'taxon');/*debg-log*///console.log("realmTaxon = %O", realmTaxonRcrd);
    updateRealmTableState(realmId, realmTaxonRcrd);
    return realmTaxonRcrd;
}
function updateRealmTableState(realmId, realmTaxonRcrd) {
    _u.setData('curView', realmId);
    tState.realmLvl = realmTaxonRcrd.level;  
    tState.curView = realmId; 
}
/** This catches errors in realm value caused by exiting mid-tutorial. TODO */
function getSelValOrDefault(val) {
    return !val ? 2 : isNaN(val) ? 2 : val; //2 - Bats
}
/**
 * Builds a taxon data-tree for the passed taxon. The taxon levels present in 
 * the tree are stored or updated before continuing @getInteractionsAndFillTable.
 * Note: This is the entry point for filter-related taxon-table rebuilds.
 */
export function rebuildTxnTable(topTaxon, filtering, textFltr) {    /*Perm-log*/console.log('       --rebuildTxnTable. topTaxon = %O, filtering ? [%s], textFilter ? [%s]', topTaxon, filtering, textFltr);
    if (!tState.api || tState.flags.allDataAvailable) { _ui.fadeTable(); } 
    return startTxnTableBuildChain(topTaxon, filtering, textFltr)
}
/**
 * Builds a family tree of taxon data with passed taxon as the top of the tree, 
 * transforms that data into the format used for ag-grid and loads the grid, aka table. 
 * The top taxon's id is added to the global focus storage obj's 'openRows' 
 * and will be expanded on table load. 
 */
function startTxnTableBuildChain(topTaxon, filtering, textFltr) {
    tState.openRows = [topTaxon.id.toString()];
    return data_tree.buildTxnTree(topTaxon, filtering, textFltr)
        .then(tree => frmt_data.buildTxnRowData(tree, tState))
        .then(rowData => loadTbl('Taxon Tree', rowData, tState))
        .then(() => {
            _ui.loadTxnFilterPanelElems(tState);
            db_filters.updateTaxonFilterViewMsg(topTaxon.realm.pluralName);
        });
}
