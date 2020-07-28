/**
 * Sub-forms, form rows, field elements, etc.
 *
 * Exports:
 *     _cmbx
 *     _panel
 *     buildAndAppendForm
 *     buildFieldInput
 *     buildFormRows
 *     buildLongTextArea
 *     checkReqFieldsAndToggleSubmitBttn
 *     disableSubmitBttn
 *     enableSubmitBttn
 *     exitSuccessMsg
 *     getExitButton
 *     getFormFieldRows
 *     getFormFooter
 *     ifAllRequiredFieldsFilled
 *     initSubForm
 *     setCoreRowStyles
 *     showSuccessMsg
 *     toggleSubmitBttn
 *     toggleWaitOverlay
 *
 * TOC
 *     EXECUTE MODULE COMMANDS
 *     FACADE
 *     HELPERS
 *         FORM-STATUS MESSAGES
 *         SUBMIT BUTTON
 *         TOGGLE FORM-FILDS
 *         EXIT FORM
 */
import { _filter, _u, executeMethod, reloadTableWithCurrentFilters } from '../../db-main.js';
import { _form, _state, getNextFormLevel, clearFormMemory } from '../forms-main.js';
import * as panel from './detail-panel/detail-panel.js';
import * as cmbx from './form-elems/fields/combobox-fields.js';
import * as base from './form-elems/base-form.js';
import * as fields from './form-elems/fields/field-builder.js';
import * as rows from './form-elems/rows/rows-main.js';
import buildFormFooter from './form-elems/footer/form-footer.js';
import handleSubFormInit from './form-elems/sub-form.js';

/* -------------------- EXECUTE MODULE COMMANDS ----------------------------- */
export function _cmbx(funcName, params = []) {
    return executeMethod(funcName, cmbx, 'cmbx', 'elems-main', params);
}
export function _panel(funcName, params = []) {
    return executeMethod(funcName, panel, 'panel', 'elems-main', params);
}
/* ------------------- FACADE ----------------------------------------------- */
export function buildAndAppendForm(fields, id) {
    return base.buildAndAppendRootForm(fields, id);
}
export function getExitButton() {
    return base.getExitButton();
}
export function getFormFooter() {
    return buildFormFooter(...arguments);
}
export function initSubForm() {
    return handleSubFormInit(...arguments);
}
export function buildFormRows() {
    return rows.buildFormRows(...arguments);
}
export function getFormFieldRows() {
    return rows.getFormFieldRows(...arguments);
}
export function buildFieldInput() {
    return fields.buildFieldInput(...arguments);
}
export function ifAllRequiredFieldsFilled() {
    return fields.ifAllRequiredFieldsFilled(...arguments);
}
/* =============================== HELPERS ================================== */
export function setCoreRowStyles(formId, rowClass) {
    const w = $(formId).innerWidth() / 2 - 3;
    $(rowClass).css({'flex': '0 1 '+w+'px', 'max-width': w});
}
/* used by form-errors & submit-main */
export function toggleWaitOverlay(waiting) {                                    //console.log("toggling wait overlay")
    if (waiting) { appendWaitingOverlay();
    } else { $('#c-overlay').remove(); }
}
function appendWaitingOverlay() {
    const attr = { class: 'overlay waiting', id: 'c-overlay'}
    $('#b-overlay').append(_u('buildElem', ['div', attr]));
    $('#c-overlay').css({'z-index': '1000', 'display': 'block'});
}
/* --------------------- FORM STATUS MESSAGES ------------------------------- */
/** Shows a form-submit success message at the top of the interaction form. */
export function showSuccessMsg(msg, color = 'green') {
    const cntnr = _u('buildElem', ['div', { id: 'success' }]);
    cntnr.append(getSuccessMsgHtml(msg));
    $(cntnr).css('border-color', (color));
    $('#top-hdr').after(cntnr);
    $(cntnr).fadeTo('400', .8);
}
function getSuccessMsgHtml(msg) {
    const div = _u('buildElem', ['div', { class: 'flex-row' }]);
    const p = _u('buildElem', ['p', { text: msg }]);
    const bttn = getSuccessMsgExitBttn();
    div.append(p, bttn);
    return div;
}
function getSuccessMsgExitBttn() {
    const attr = { 'id': 'sucess-exit', 'class': 'exit-bttn',
        'type': 'button', 'value': 'X' }
    const bttn = _u('buildElem', ['input', attr]);
    $(bttn).click(exitSuccessMsg);
    return bttn;
}
export function exitSuccessMsg() {
    $('#success').fadeTo('400', 0, () => $('#success').remove());
}
/* --------------------------- SUBMIT BUTTON -------------------------------- */
export function toggleSubmitBttn(bttnId, enable = true) {
    return enable ? enableSubmitBttn(bttnId) : disableSubmitBttn(bttnId);
}
/** Enables passed submit button */
export function enableSubmitBttn(bttnId) {
    $(bttnId).attr("disabled", false).css({"opacity": "1", "cursor": "pointer"});
}
/** Enables passed submit button */
export function disableSubmitBttn(bttnId) {                                     //console.log('disabling bttn = ', bttnId)
    $(bttnId).attr("disabled", true).css({"opacity": ".6", "cursor": "initial"});
}
/* ----------- ENABLE WHEN REQUIRED FIELDS FILLED ----------- */
/**
 * Note: The 'unchanged' property exists only after the create interaction form
 * has been submitted and before any changes have been made.
 */
export function checkReqFieldsAndToggleSubmitBttn(fLvl) {
    const reqFieldsFilled = ifNoOpenSubFormAndAllRequiredFieldsFilled(fLvl);
    toggleSubmitBttn('#'+fLvl+'-submit', reqFieldsFilled);
    return reqFieldsFilled;
}
function ifNoOpenSubFormAndAllRequiredFieldsFilled(fLvl) {
    return fields.ifAllRequiredFieldsFilled(fLvl) &&
        !hasOpenSubForm(fLvl) && !locHasGpsData(fLvl);
}
/** Returns true if the next sub-level form exists in the dom. */
function hasOpenSubForm(fLvl) {
    const childFormLvl = getNextFormLevel('child', fLvl);
    return $('#'+childFormLvl+'-form').length > 0;
}
/** Prevents the location form's submit button from enabling when GPS data entered.*/
function locHasGpsData(fLvl) {
    if (_state('getFormProp', [fLvl, 'entity']) !== 'location') { return false; }
    if (_state('getFormProp', [fLvl, 'action']) === 'edit') { return false; }
    return ['Latitude', 'Longitude'].some(field => {
        return $(`#${field}_row input`).val();
    });
}
/* -------------------- TOGGLE FORM-FIELDS ---------------------------------- */
export function setToggleFieldsEvent(elem, entity, fLvl) {
    $(elem).click(toggleShowAllFields.bind(elem, entity, fLvl));
}
/**
 * Toggles between displaying all fields for the entity and only showing the
 * default (required and suggested) fields.
 */
function toggleShowAllFields(entity, fLvl) {                                    //console.log('--- Showing all [%s] [%s] Fields [%s] -------', entity, fLvl, this.checked);
    if (ifOpenSubForm(fLvl)) { return showOpenSubFormErr(fLvl); }
    updateFormMemoryOnFieldToggle(this.checked, fLvl);
    const fVals = getCurrentFormFieldVals(fLvl);                                //console.log('vals before fill = %O', _u('snapshot', [fVals]));
    $('#'+entity+'_Rows').empty();
    rows.getFormFieldRows(entity, fVals, fLvl)
    .then(appendAndFinishRebuild);

    function appendAndFinishRebuild(rows) {
        $('#'+entity+'_Rows').append(rows);
        _form('initFormCombos', [_u('lcfirst', [entity]), fLvl]);
        fillComplexFormFields(fLvl)
        .then(finishComplexForms);
    }
    function finishComplexForms() {
        const complex = ['citation', 'publication', 'location'];
        if (complex.indexOf(entity) === -1) { return; }
        if (entity !== 'location') { _form('onSrcToggleFields', [entity, fVals, fLvl]); }
        setCoreRowStyles('#'+entity+'_Rows', '.'+fLvl+'-row');
    }
} /* End toggleShowAllFields */
function updateFormMemoryOnFieldToggle(isChecked, fLvl) {
    _state('setFormProp', [fLvl, 'expanded', isChecked]);
    _state('setFormProp', [fLvl, 'reqElems', []]);
}
function ifOpenSubForm(fLvl) {
    const subLvl = getNextFormLevel('child', fLvl);
    return $('#'+subLvl+'-form').length !== 0;
}
function showOpenSubFormErr(fLvl) {
    const subLvl = getNextFormLevel('child', fLvl);
    let entity = _u('ucfirst', [_state('getFormProp', [fLvl, entity])]);
    if (entity === 'Author' || entity === 'Editor') { entity += 's'; }
    _val('openSubFormErr', [entity, null, subLvl, true]);
    $('#sub-all-fields')[0].checked = !$('#sub-all-fields')[0].checked;
}
/*------------ Fill Form Fields -----------------*/
/** Returns an object with field names(k) and values(v) of all form fields*/
export function getCurrentFormFieldVals(fLvl) {
    const fieldData = _state('getFormProp', [fLvl, 'fieldData']);
    const vals = {};
    for (let field in fieldData) {
        vals[field] = fieldData[field].val;
    }
    return vals;
}
/**
 * When either source-type fields are regenerated or the form fields are toggled
 * between all available fields and the default shown, the fields that can
 * not be reset as easily as simply setting a value in the form input during
 * reinitiation are handled here.
 */
export function fillComplexFormFields(fLvl) {
    const fieldData = _state('getFormProp', [fLvl, 'fieldData']);
    const fieldHndlrs = { 'multiSelect': getMultiSelectHandler() };
    const fields = Object.keys(fieldData).filter(f => fieldData[f].type in fieldHndlrs);
    return fields.reduce(fillAllComplexFieldsWithData, Promise.resolve());

    function fillAllComplexFieldsWithData(p, field) {
        const type = fieldData[field].type;
        const val = fieldData[field].val;
        return p.then(() => fieldHndlrs[type]([field, val, fLvl]));
    }
} /* End fillComplexFormFields */
function getMultiSelectHandler() {
    return _form.bind(null, 'selectExistingAuthors');
}
export function ifFieldIsDisplayed(field, fLvl) {
    return !!_state('getFormFieldData', [fLvl, field]);
}
/** Enables the parent form's submit button if all required fields have values. */
export function ifParentFormValidEnableSubmit(fLvl) {
    const parentLvl = getNextFormLevel('parent', fLvl);
    checkReqFieldsAndToggleSubmitBttn(parentLvl);
}
/* ---------------------------- EXIT FORM ----------------------------------- */
/**
 * Removes the form container with the passed id, clears and enables the combobox,
 * and contextually enables to parent form's submit button. Calls the exit
 * handler stored in the form's params object.
 */
export function exitSubForm(fLvl, focus, onExit, data) {
    const exitFunc = onExit || _state('getFormProp', [fLvl, 'onFormClose']);    console.log("               --exitSubForm fLvl = %s, onExit = %O", fLvl, exitFunc);
    $('#'+fLvl+'-form').remove();
    cmbx.resetFormCombobox(fLvl, focus);
    ifParentFormValidEnableSubmit(fLvl);
    if (exitFunc) { exitFunc(data); }
}
/** Returns popup and overlay to their original/default state. */
export function exitFormPopup(e, skipReset) {                                   console.log('           --exitFormPopup')
    hideSearchFormPopup();
    if (!skipReset) { refocusTableIfFormWasSubmitted(); }
    $('#b-overlay').removeClass('form-ovrly');
    $('#b-overlay-popup').removeClass('form-popup');
    $('#b-overlay-popup').empty();
    clearFormMemory();
}
function hideSearchFormPopup() {
    $('#b-overlay').css({display: 'none'});
}
/**
 * If the form was not submitted the table does not reload. Otherwise, if exiting
 * the edit-forms, the table will reload with the current focus; or, after creating
 * an interaction, the table will refocus into source-view. Exiting the interaction
 * forms also sets the 'int-updated-at' filter to 'today'.
 */
function refocusTableIfFormWasSubmitted() {
    const submitData = _state('getStateProp', ['submit']);                      //console.log('refocusTableIfFormWasSubmitted. submitData = %O', submitData);
    if (!submitData) { return; }
    if (submitData.entity === 'interaction') { return refocusAndShowUpdates(submitData); }
    reloadTableWithCurrentFilters();
}
function refocusAndShowUpdates(submitData) {                                    //console.log('refocusAndShowUpdates.')
    if (_state('getFormProp', ['top', 'action']) === 'create') {
        _filter('showTodaysUpdates', ['srcs']);
    } else {
        reloadTableWithCurrentFilters();
    }
}