/*
 * Filters the interactions by the text in the tree column of the data table.
 *
 * Exports:
 *      getRowsWithText
 *      getTreeTextFilterElem
 *      getTreeFilterVal
 *
 * TOC:
 *      BUILS FILTER ELEM
 *      SYNC WITH ACTIVE FILTERS
 */
import { _el } from '~util';
import * as fM from '../filter-main.js';
/* ====================== BUILD FILTER ELEM ================================= */
/** Returns a text input with submit button that will filter tree by text string. */
export function getTreeTextFilterElem(entity) {
    const input = buildTxtSearchInput(entity);
    return fM.getFilterField('Name', input);
}
function buildTxtSearchInput(entity) {
    const attr = {
        class: 'field-input',
        name: 'name-'+entity,
        placeholder: entity+' Name (Press Enter to Filter)',
        type: 'text',
    };
    const input = _el('getElem', ['input', attr]);
    return addInputChangeEvent(entity, input);
}
function addInputChangeEvent(entity, input) {
    $(input).change(onTextFilterChange.bind(null, entity));
    return input;
}
/* ========================= APPLY FILTER =================================== */
function onTextFilterChange(entity, e) {
    const text = getTreeFilterVal(entity);
    updateTreeFilterState(text);
    fM.onFilterChangeUpdateRowData();
}
export function getTreeFilterVal(entity) {                         /*debug-log*///console.log('getTreeFilterVal entity = ', entity);
    return $('input[name="name-'+entity+'"]').val().trim().toLowerCase();
}
function updateTreeFilterState(text) {
    const val = !text ? false : '"'+text+'"';
    fM.setFilterState('name', val, 'direct');
}