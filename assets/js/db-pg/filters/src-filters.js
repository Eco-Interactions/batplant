/*
 * Filters interactions by publication type when in Source->publication view .
 * Synchronizes the tree-text filter and the combobox filter. 
 * 
 * Exports:
 *      loadSrcFilters
 *      updatePubSearch
 *      
 * TOC:
 *      UI
 *      FILTER
 */
import { _filter, _ui, _u,  accessTableState as tState } from '../db-main.js';
/* ========================= UI ============================================ */
export function loadSrcFilters(realm) {                             /*Perm-log*/console.log("       --Init Source Filter Panel UI. realm = [%s]", realm);
    if ($('#focus-filters label').length) { return clearPanelCombos(realm); }
    const buildUi = { 'auths': loadAuthSearchHtml, 'pubs': loadPubSearchHtml, 
        'publ':loadPublSearchHtml }; 
    return buildUi[realm](); 
} 
function clearPanelCombos(realm) {
    if (realm !== 'pubs') { return Promise.resolve(); }
    return Promise.resolve($('#selPubType')[0].selectize.clear('silent'));
}
/** Builds a text input for searching author names. */
function loadAuthSearchHtml() {
    const searchTreeElem = _filter('getTreeTextFilterElem', ['Author'])
    $('#focus-filters').append(searchTreeElem);
    return Promise.resolve();
}
function loadPubSearchHtml() {
    return _u('getOptsFromStoredData', ['pubTypeNames'])
        .then(loadPubSearchElems);
}
function loadPubSearchElems(pubTypeOpts) {
    const pubTypeElem = buildPubTypeSelect(pubTypeOpts);
    const searchTreeElem = _filter('getTreeTextFilterElem', ['Publication'])
    $('#focus-filters').append([searchTreeElem, pubTypeElem]);
    _u('initCombobox', ['Publication Type', updatePubSearch]);
    $('#selPubType')[0].selectize.clear('silent'); //todo: figure out where 'all' is getting selected and remove.
}         
/** Builds the publication type dropdown */
function buildPubTypeSelect(opts) {                                             //console.log("buildPubSelects pubTypeOpts = %O", pubTypeOpts)
    const lbl = _u('buildElem', ['label', {class: "sel-cntnr flex-row"}]);
    const span = _u('buildElem', ['span', { text: 'Type:' }]);
    const sel = newSelEl(addAllOpt(opts), '', 'selPubType', 'Publication Type');
    const lblW = $(window).width() > 1500 ? '222px' : '230px';
    $(sel).css('width', '177px');
    $(lbl).css('width', lblW).append([span, sel]);
    return lbl;
}
function newSelEl(opts, c, i, field) {                                   //console.log('newSelEl for [%s]. args = %O', field, arguments);
    const elem = _u('buildSelectElem', [opts, { class: c, id: i }]);
    $(elem).data('field', field);
    return elem;
}
function addAllOpt(opts) {
    opts.unshift({value: 'all', text: '- All -'});
    return opts;
}
function loadPublSearchHtml() {
    const searchTreeElem = _filter('getTreeTextFilterElem', ['Publisher'])
    $('#focus-filters').append(searchTreeElem);
    return Promise.resolve();
}
 /* ===================== FILTER ============================================ */
/**
 * When viewing by publication, interactions can be filtered by the publication type.
 * Handles synchronizing with the tree-text filter. 
 */
export function updatePubSearch(tId, text) {                                    console.log('       +-updatePubSearch. typeId [%s], text [%s]', typeId, text);
    if (!tId) { return; }
    const tblState = tState().get(null, ['api', 'rowData', 'curFocus']);  
    const typeId = tId || _u('getSelVal', ['Publication Type']); 
    const txt = text || _filter('getTreeFilterVal', ['Publication']);
    const newRows = getFilteredPubRows();
    if (typeId) { setPubFilters(); }
    tblState.api.setRowData(newRows);
    _ui('setTreeToggleData', [false]);
    return Promise.resolve(); //Needed when loading filter set

    function getFilteredPubRows() {
        return !typeId || typeId == 'all' ? _filter('getRowsWithText', [txt])
            : (txt === '' ? getAllPubTypeRows() : getPubTypeRows(typeId));
    }
    function getPubTypeRows(typeId) {
        return _filter('getCurRowData').filter(r => { 
            return r.type == typeId && r.name.toLowerCase().indexOf(txt) !== -1;
        });
    }
    /** Returns the rows for publications with their id in the selected type's array */
    function getAllPubTypeRows() {     
        return _filter('getCurRowData').filter(row => row.type == typeId);
    }
    function setPubFilters() { 
        const typeVal = $(`#selPubType option[value="${typeId}"]`).text();
        const truncTxt = txt ? 
            (txt.length > 50 ? txt.substring(0, 50)+'...' : txt) : null; 
        updatePubFilterState(typeVal, typeId, truncTxt);
        _ui('updateFilterStatusMsg');
    }
    function updatePubFilterState(type, id, text) {
        const filter = type === '- All -' ? false : buildPubFilterObj({});
        _filter('setPanelFilterState', ['combo', filter]);
        
        function buildPubFilterObj(obj) {
            obj['Publication Type'] = { text: 'Publication Type', value: id };
            return obj;
        }
    }
} 