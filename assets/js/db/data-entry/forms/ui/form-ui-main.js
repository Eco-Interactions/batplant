/**
 *
 *
 *
 * 
 */
import * as _i from '../forms-main.js';
import * as _cmbx from './combobox-util.js';
import * as _elems from './form-elems.js';
import * as _pnl from './detail-panel.js';

export function elems(funcName, params) {
    return _elems[funcName](...params);
}
export function combos(funcName, params) {
    return _cmbx[funcName](...params);
}
export function panel(funcName, params) {
    return _pnl[funcName](...params);
}
/* =============================== HELPERS ================================== */
export function setCoreRowStyles(formId, rowClass) {
    const w = $(formId).innerWidth() / 2 - 3;  
    $(rowClass).css({'flex': '0 1 '+w+'px', 'max-width': w});
}
/** Shows a form-submit success message at the top of the interaction form. */
export function showSuccessMsg(msg, color) {
    const cntnr = _i.util('buildElem', ['div', { id: 'success' }]);
    const msgHtml = getSuccessMsgHtml(msg);
    cntnr.append(div);
    $(cntnr).css('border-color', (color ? color : 'greem'));
    $('#top-hdr').after(cntnr); 
    $(cntnr).fadeTo('400', .8);
}
function getSuccessMsgHtml(msg) {
    const div = _i.util('buildElem', ['div', { class: 'flex-row' }]);
    const p = _i.util('buildElem', ['p', { text: msg }]);
    const bttn = getSuccessMsgExitBttn();
    div.append(p, bttn);
    return div;
}
function getSuccessMsgExitBttn() {
    const attr = { 'id': 'sucess-exit', 'class': 'tbl-bttn exit-bttn', 
        'type': 'button', 'value': 'X' }
    const bttn = _i.util('buildElem', ['input', attr]);
    $(bttn).click(exitSuccessMsg);
    return bttn;
}
export function exitSuccessMsg() {
    $('#success').fadeTo('400', 0, () => $('#success').remove());
}
/* ============================ EXIT FORM =================================== */
/**
 * Removes the form container with the passed id, clears and enables the combobox,
 * and contextually enables to parent form's submit button. Calls the exit 
 * handler stored in the form's params object.
 */
export function exitForm(fLvl, focus, onExit, data) {                           
    const exitFunc = onExit || _i.mmry('getFormProp', [fLvl, 'onFormClose']);   console.log("               --exitForm fLvl = %s, onExit = %O", fLvl, exitFunc);      
    $('#'+fLvl+'-form').remove();  
    _cmbx.resetFormCombobox(fLvl, focus);
    if (fLvl !== 'top') { ifParentFormValidEnableSubmit(fLvl); }
    if (exitFunc) { exitFunc(data); }
}
/** Returns popup and overlay to their original/default state. */
export function exitFormPopup(e, skipReset) {                                   console.log('           --exitFormPopup')
    hideSearchFormPopup();
    if (!skipReset) { refocusTableIfFormWasSubmitted(); }
    $('#b-overlay').removeClass('form-ovrly');
    $('#b-overlay-popup').removeClass('form-popup');
    $('#b-overlay-popup').empty();
    _i.clearFormMemory();
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
    const formFocus = _i.mmry('getMemoryProp', ['submit']).focus;               //console.log('refocusTableIfFormWasSubmitted. focus = [%s]', formFocus);
    if (!formFocus) { return; }
    if (formFocus == 'int') { return refocusAndShowUpdates(); }   
    _i.loadDataTableAfterFormClose(formFocus);
}
function refocusAndShowUpdates() {                                              //console.log('refocusAndShowUpdates.')
    const formAction = _i.mmry('getMemoryProp', ['action']);
    const tableFocus  = formAction === 'create' ? 'srcs' : getCurFocus();
    showTodaysUpdates(tableFocus);   
}
function getCurFocus() {
    return _i.mmry('getMemoryProp', ['curFocus']);
}

/** -------------- sort! --------------- */
export function setToggleFieldsEvent(elem, entity, fLvl) {
    $(elem).click(toggleShowAllFields.bind(elem, entity, fLvl));
}
/**
 * Toggles between displaying all fields for the entity and only showing the 
 * default (required and suggested) fields.
 */
function toggleShowAllFields(entity, fLvl) {                                    //console.log('--- Showing all Fields [%s] -------', this.checked);
    if (ifOpenSubForm(fLvl)) { return showOpenSubFormErr(fLvl); }
    updateFormMemoryOnFieldToggle(this.checked, fLvl);
    const fVals = getCurrentFormFieldVals(fLvl);                                //console.log('vals before fill = %O', _i.util('snapshot', [fVals]));
    $('#'+entity+'_Rows').empty();
    _elems.getFormFieldRows(entity, fVals, fLvl)
    .then(appendAndFinishRebuild);

    function appendAndFinishRebuild(rows) {
        $('#'+entity+'_Rows').append(rows);
        _i.entity('initFormCombos', [_i.util('lcfirst', [entity]), fLvl]);
        fillComplexFormFields(fLvl);
        finishComplexForms();
    }
    function finishComplexForms() {
        if (['citation', 'publication', 'location'].indexOf(entity) === -1) { return; }
        if (entity !== 'location') { _i.entity('onSrcToggleFields', [entity, fVals, fLvl]); }
        setCoreRowStyles('#'+entity+'_Rows', '.'+fLvl+'-row');
    }
} /* End toggleShowAllFields */
function updateFormMemoryOnFieldToggle(isChecked, fLvl) {
    _i.mmry('setFormProp', [fLvl, 'expanded', isChecked]);
    _i.mmry('setFormProp', [fLvl, 'reqElems', []]);
}
function ifOpenSubForm(fLvl) {
    const subLvl = _i.getNextFormLevel('child', fLvl);
    return $('#'+subLvl+'-form').length !== 0;
}
function showOpenSubFormErr(fLvl) {
    const subLvl = _i.getNextFormLevel('child', fLvl);
    let entity = _i.util('ucfirst', [_i.mmry('getFormProp', [fLvl, entity])]);
    if (entity === 'Author' || entity === 'Editor') { entity += 's'; }
    _i.err('openSubFormErr', [entity, null, subLvl, true]);   
    $('#sub-all-fields')[0].checked = !$('#sub-all-fields')[0].checked;
}
/*--------------------------- Misc Form Helpers ------------------------------*/
/*--------------------------- Fill Form Fields -------------------------------*/
/** Returns an object with field names(k) and values(v) of all form fields*/
export function getCurrentFormFieldVals(fLvl) { 
    const fieldData = _i.mmry('getFormProp', [fLvl, 'fieldData']);       
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
    const fieldData = _i.mmry('getFormProp', [fLvl, 'fieldData']);                       
    const fieldHndlrs = { 'multiSelect': getMultiSelectHandler() };
    const fields = Object.keys(fieldData).filter(f => fieldData[f].type in fieldHndlrs); 

    fields.forEach(field => {
        const type = fieldData[field].type;
        const val = fieldData[field].val;
        fieldHndlrs[type]([field, val, fLvl]);        
    };
} /* End fillComplexFormFields */
function getMultiSelectHandler() {
    return _i.entity.bind(null, 'selectExistingAuthors');
}
export function ifFieldIsDisplayed(field, fLvl) {
    return !!_i.mmry('getFormFieldData', [fLvl, field]);
}
/** Enables the parent form's submit button if all required fields have values. */
export function ifParentFormValidEnableSubmit(fLvl) {
    const parentLvl = _i.getNextFormLevel('parent', fLvl);  
    if (_elems.ifAllRequiredFieldsFilled(parentLvl)) {
        toggleSubmitBttn('#'+parentLvl+'-submit', true);
    }
}
export function toggleSubmitBttn(bttnId, enable) {
    return enable ? enableSubmitBttn(bttnId) : disableSubmitBttn(bttnId);
}
/** Enables passed submit button */
export function enableSubmitBttn(bttnId) {  
    $(bttnId).attr("disabled", false).css({"opacity": "1", "cursor": "pointer"}); 
}  
/** Enables passed submit button */
export function disableSubmitBttn(bttnId) {                                            //console.log('disabling bttn = ', bttnId)
    $(bttnId).attr("disabled", true).css({"opacity": ".6", "cursor": "initial"}); 
}  
/* used by form-errors & submit-main */
export function toggleWaitOverlay(waiting) {                                           //console.log("toggling wait overlay")
    if (waiting) { appendWaitingOverlay();
    } else { $('#c-overlay').remove(); }  
}
function appendWaitingOverlay() {
    const attr = { class: 'overlay waiting', id: 'c-overlay'}
    $('#b-overlay').append(_i.util('buildElem', ['div', attr]));
    $('#c-overlay').css({'z-index': '1000', 'display': 'block'});
}