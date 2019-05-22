/**
 * Handles the saving, editing, and display of saved sets of filters.
 *
 * Exports:                 Imported By:                  (Added all post initial refactor)
 *     addFilterPanelEvents         panel-util
 *     newFilterSet                     util
 *     selFilterSet                     util
 */
import * as _u from '../util.js';
import * as _uPnl from './panel-util.js';
import * as data_tree from './build-data-tree.js';
import * as db_filters from './db-filters.js';
import * as frmt_data from './format-data.js'; 
import { updateUserNamedList } from '../db-sync.js';
import { accessTableState as tState, resetSearchState } from '../db-page.js';
import { resetToggleTreeBttn } from './db-ui.js';

/**
 * fltr - List open in panel
 * tblApi - AgGrid table api
 * tblState - state data for table and search page
] */
let app = {};

export function addFilterPanelEvents() {  
    $('#filter').click(toggleFilterPanel);                                      
    $('#shw-chngd').change(db_filters.toggleTimeUpdatedFilter);
    $('#delete-filter').click(deleteFilterSet);
    $('#confm-set-delete').click(confmDelete);
    $('#cncl-set-delete').click(cancelDelete);
}

/* ====================== SHOW/HIDE LIST PANEL ============================== */
export function toggleFilterPanel() {  
    if ($('#filter-opts').hasClass('closed')) { buildAndShowFilterPanel(); 
    } else { _uPnl.togglePanel('#filter-opts', 'close'); }
}
/* ============== CREATE/OPEN FILTER SET ==================================== */
function buildAndShowFilterPanel() {                                            //console.log('buildAndShowFilterPanel')
    _uPnl.togglePanel('#filter-opts', 'open');
    initSavedFiltersUi();
}
function initSavedFiltersUi() {
    initSavedFiltersCombobox();
    disableFilterSetInputs();
}
function initSavedFiltersCombobox() {
    _u.initCombobox('Saved Filter Set');
    updateFilterSel();
}
function updateFilterSel() {
    const opts = _u.getOptsFromStoredData('savedFilterNames');                     
    opts.unshift({value: 'create', text: '...New Saved Filter Set'});
    _u.replaceSelOpts('#saved-filters', opts);
}
/* ------ CREATE FILTER SET ------- */
export function newFilterSet(val) {                                             console.log('creating filter set. val = %s', val);                                     
    enableFilterSetInputs('create');
    _uPnl.updateSubmitEvent('#save-filter', createFilterSet);
    $('#filter-set-name + input').val(val).focus();
    return { value: 'new', text: val ? val : "Creating New Filter Set" };
}
function createFilterSet() {
    const data = buildFilterData();
    _uPnl.submitUpdates(data, 'create', onFilterSubmitComplete.bind(null, 'create'));
}



/* ------ OPEN FILTER SET ------- */
export function selFilterSet(val) {                                             console.log('loading filter set. val = %s', val);
    if (val === 'create') { return newFilterSet(); }
    if (!val) { return resetFilterUi(); }
    if (val === 'new') { return; } // New list typed into combobox
    enableFilterSetInputs();
    _uPnl.updateSubmitEvent('#save-filter', editFilterSet);
    fillFilterData(val);
}
function editFilterSet() {
    const data = buildFilterData();
    data.id = _u.getSelVal('Saved Filter Set');
    _uPnl.submitUpdates(data, 'edit', onFilterSubmitComplete.bind(null, 'edit'));
}
function fillFilterData(id) {
    const filters = _u.getDataFromStorage('savedFilters');                           
    const filter = addActiveFilterToMemory(filters[id]);                        //console.log('activeFilter = %O', filter);                                                 
    fillFilterDetailFields(filter.displayName, filter.description);
}
function fillFilterDetailFields(name, description) {
    $('#filter-set-name + input').val(name).focus();
    $('.filter-set-details textarea').val(description);
}
/* =================== BUILD FILTER DATA JSON =============================== */
function buildFilterData() {
    app.tblState = tState().get(null, ['curFocus', 'curView', 'api']);
    const data = {
        displayName: $('#filter-set-name + input').val(),
        type: 'filter',
        description: $('#stored-filters textarea').val(),
        details: getFilterSetJson(app.tblState),
    };
    return data;
}
/**
 * filters: {
 *     focus: '',
 *     view: '',
 *     panel: {
 *         text:
 *         combobox:
 *         time:
 *     },
 *     table: {
 *         displayName: { colName: filterModel }},
 * }
 */
function getFilterSetJson(tState) {                                             //console.log('tblState = %O', tState)
    const filters = {
        focus: tState.curFocus, panel: getFiltersInPanel(),
        table: getColumnHeaderFilters(), view: tState.curView
    };
    return JSON.stringify(filters);
}
function getFiltersInPanel() {
    const panelFilters = db_filters.getExternalFilters();                       //console.log('panelFilters = %O', panelFilters);
    return {};
}
/** Returns an obj with the ag-grid filter models. */
function getColumnHeaderFilters() {
    const models = db_filters.getTableFilterModels();              
    const colTitles = Object.keys(models);
    return getActiveTableFilters();
    
    function getActiveTableFilters() {
        const filters = {};
        colTitles.forEach(col => { 
            if (!models[col]) { return; }  
            filters[col] = models[col];
        });                                                                     //console.log('tableFilters = %O', filters);
        return filters;
    }
}
/* ====================== DELETE FILTER SET ================================= */
function deleteFilterSet() {                                              //console.log('deleteInteractionList')
    $('#delete-filter').hide();
    $('#set-confm-cntnr').show();  
    hideSavedMsg();  
}
function confmDelete() {  
    resetDeleteButton();
    _uPnl.submitUpdates({id: app.fltr.id}, 'delete', onFilterDeleteComplete);
}
function cancelDelete() {
    resetDeleteButton();
}
function resetDeleteButton() {
    $('#set-confm-cntnr').hide();    
    $('#delete-filter').show();
}
/* ================== APPLY FILTER SET TO TABLE DATA ======================== */

/* ====================== UTILITY =========================================== */
function addActiveFilterToMemory(set) {
    app.fltr = _uPnl.parseUserNamed(set);
    return app.fltr;
}
/* ---------------- SUBMIT AND SUCCESS METHODS -------------------------------*/
function submitFilterSet(data, action, successFunc) {
    const envUrl = $('body').data("ajax-target-url");
    _u.sendAjaxQuery(data, envUrl + 'lists/' + action, onFilterSubmitComplete.bind(null, action));
}
function onFilterSubmitComplete(action, results) {          
    const filter = JSON.parse(results.list.entity);                             console.log('onFilterSubmitComplete results = %O, filter = %O', results, filter);
    updateUserNamedList(results.list, action);
    updateFilterSel();
    $('#saved-filters')[0].selectize.addItem(filter.id);
    showSavedMsg();
}
function onFilterDeleteComplete(results) {                                      console.log('listDeleteComplete results = %O', results)
    updateUserNamedList(results.list, 'delete');
    updateFilterSel();
    $('#saved-filters')[0].selectize.open();
}
function showSavedMsg() {
    $('#set-submit-msg').fadeTo('slow', 1);
}
function hideSavedMsg() {
    $('#set-submit-msg').fadeTo('slow', 0);
}
/* ------------------------------- UI ----------------------------------------*/
/* ---- Reset & Enable/Disable UI --- */
function resetFilterUi() {
    hideSavedMsg();
    clearFilterDetailFields();
    disableFilterSetInputs();
}
function clearFilterDetailFields() {
    $('#filter-set-name + input').val('');
    $('.filter-set-details textarea').val('');
}
function disableFilterSetInputs() {
    $('.filter-set-details input, .filter-set-details textarea').val('');
    $(`.filter-set-details input, .filter-set-details span, .filter-submit button, 
        .filter-set-details textarea, #stored-filters button`)
        .attr('disabled', true).css('opacity', '.5');
}
function enableFilterSetInputs(create) {
    $(`.filter-set-details input, .filter-set-details span, .filter-submit button, 
        .filter-set-details textarea, #save-filter`)
        .attr('disabled', false).css('opacity', '1');
    if (!create) { $('#delete-filter').attr('disabled', false).css('opacity', '1'); }
}
/* --- Table Methods --- */