/**
 * Builds and manages the form fields.
 *
 * TOC
 *     FORM COMBOS
 *     INIT FORM-FIELDS
 *         BUILD FIELD-ROWS
 *     FORM-FIELD UTILITY
 *     ON FIELD CHANGE
 */
import { _el } from '~util';
import * as build from './build-field.js';
import * as combo from './combo-field.js';
import * as util from './util/field-util-main.js';

/* ======================== FORM COMBOS ===================================== */
export function resetFormCombobox() {
    combo.resetFormCombobox(...arguments);
}
export function setSilentVal() {
    combo.setSilentVal(...arguments);
}
export function initFormCombos() {
    combo.initFormCombos(...arguments);
}
/* ==================== INIT FORM-FIELDS ================================== */
export function buildFormField() {
    return build.buildFormField(...arguments);
}
export function buildDynamicFormField() {
    return build.buildDynamicFormField(...arguments);
}
/* ------------------- BUILD FIELD-ROWS ------------------------------------- */
export function getFormFieldRows() {
    return row.getFormFieldRows(...arguments);
}
export function buildFormRows() {
    return row.buildFormRows(...arguments);
}
/* =================== FORM-FIELD UTILITY =================================== */
export function setDynamicFieldStyles() {
    util.setDynamicFieldStyles(...arguments);
}
export function ifMutlipleDisplaysGetToggle() {
    return util.ifMutlipleDisplaysGetToggle(...arguments);
}

export function rebuildFieldsOnFormConfgChanged() {
    return util.rebuildFieldsOnFormConfgChanged(...arguments);
}
/**
 * When either source-type fields are regenerated or the form fields are toggled
 * between all available fields and the default shown, the fields that can
 * not be reset as easily as simply setting a value in the form input during
 * reinitiation are handled here.
 */
export function fillComplexFormFields() {
    return util.fillComplexFormFields(...arguments);
}
/** Returns true if all the required elements for the current form have a value. */
export function ifAllRequiredFieldsFilled() {
    return util.ifAllRequiredFieldsFilled(...arguments);
}
/* ======================== ON FIELD CHANGE ================================= */
export function storeMultiSelectValue() {
    return build.storeMultiSelectValue(...arguments);
}