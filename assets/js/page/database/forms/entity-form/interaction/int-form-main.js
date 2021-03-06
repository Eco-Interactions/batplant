/**
 * Contains code specific to the interaction form. From within many of the fields
 * the editor can create new entities of the field-type by selecting the 'add...'
 * option from the field's combobox and completing the appended sub-form.
 *
 * TOC
 *     BUILD FORM
 *         FORM COMBOBOXES
 *     FORM-FIELD HELPERS
 *         CITATION
 *         LOCATION
 *     MODULE INTERNAL-USAGE
 *         CREATE SUB-ENTITY
 *             IF OPEN SUB-FORM ISSUE
 *         FORM-FIELD HELPERS
 *             PUBLICATION
 *             LOCATION
 *             SUBJECT|OBJECT
 *         HELPERS
 */
import { _cmbx, _u } from '~util';
import { _state, _elems, _form, _val } from '~form';
import * as build from './build/int-build-main.js';
import * as fields from './fields/int-fields-main.js';
/** ======================= BUILD FORM ====================================== */
export function initCreateForm(entity) {
    return build.initCreateForm();
}
export function finishEditFormBuild(entity) {
    build.finishInteractionFormBuild();
}
export function clearFormMemory() {
    fields.clearFormFieldModuleMemory();
}
/** ------------------ FORM COMBOBOXES -------------------------------------- */
export function initFormCombos(entity) {
    const events = fields.getIntFormFieldComboEvents();
    _elems('initFormCombos', ['interaction', 'top', events]);
}
/** ====================== FORM-FIELD HELPERS =============================== */
/*------------------ CITATION ------------------------------------------------*/
export function fillCitationCombo() {
    return fields.fillCitationCombo(...arguments);
}
/* ------------------ LOCATION ---------------------------------------------- */
export function selectLoc() {
    return fields.selectLoc(...arguments);
}
/** When the Location sub-form is exited, the Country/Region combo is reenabled. */
export function enableCountryRegionField() {
    return fields.enableCountryRegionField(...arguments);
}
/* *********************** MODULE INTERNAL-USAGE **************************** */
/* ==================== CREATE SUB-ENTITY =================================== */
export function create(entity, fLvl) {
    return createEntity.bind(null, entity, fLvl);
}
function createEntity(entity, fLvl, val) {
    return _form('createSubEntity', [entity, fLvl, val]);
}
export function resetInteractionForm() {                            /*dbug-log*///console.log('resetInteractionForm')
    return build.resetInteractionForm();
}
/** ====================== FORM-FIELD HELPERS =============================== */
export function initTypeField() {
    return fields.initTypeField(...arguments);
}
/* ------------------------ PUBLICATION ------------------------------------- */
export function onPubClear() {
    fields.onPubClear();
}
/* -------------------------- LOCATION -------------------------------------- */
export function fillLocCombo() {
    return fields.fillLocCombo(...arguments);
}
export function addLocationSelectionMethodsNote() {
    return fields.addLocationSelectionMethodsNote(...arguments);
}
/* --------------------- SUBJECT|OBJECT ------------------------------------- */
export function selectRoleTaxon() {
    return fields.selectRoleTaxon(...arguments);
}
export function onTaxonRoleSelection() {
    return fields.onTaxonRoleSelection(...arguments);
}
export function addRoleTaxonFocusListeners() {
    return fields.addRoleTaxonFocusListeners(...arguments);
}
export function enableRoleTaxonFieldCombos() {
    _cmbx('enableCombobox', ['Subject']);
    _cmbx('enableCombobox', ['Object']);
}
function enableTaxonRanks(enable = true) {
    $.each($('#sub-form select'), (i, sel) => {
        _cmbx('enableCombobox', ['#'+sel.id, enable])
    });
}
/* ========================== HELPERS ======================================= */
export function focusPinAndEnableSubmitIfFormValid(field) {
    const editing = _state('getFormProp', ['top', 'action']) === 'edit';
    if (!editing) { $('#'+field+'_pin').focus(); }
    checkIntFieldsAndEnableSubmit();
}
/**
 * After the interaction form is submitted, the submit button is disabled to
 * eliminate accidently creating duplicate interactions. This change event is
 * added to the non-required fields of the form to enable to submit as soon as
 * any change happens in the form, if the required fields are filled. Also
 * removes the success message from the form.
 */
export function checkIntFieldsAndEnableSubmit() {
    _elems('checkReqFieldsAndToggleSubmitBttn', ['top']);
    resetIfFormWaitingOnChanges();
}
/**
 * After an interaction is created, the form can not be submitted until changes
 * are made. This removes the change listeners from non-required elems and the
 * flag tracking the state of the new interaction form.
 */
function resetIfFormWaitingOnChanges() {
    if (!_state('getFormProp', ['top', 'unchanged'])) { return; }
    _elems('exitSuccessMsg');
    _state('setFormProp', ['top', 'unchanged', false]);
}