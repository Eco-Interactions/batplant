/**
 * Basic UI element-builders.
 * TODO: DOCUMENT
 *
 * TOC
 *
 */
import * as basic from './build-elem.js';
import * as field from './build-field.js';
import * as footer from './build-footer.js';
import * as input from './input/build-input.js';
// import * as row from './build-row.js';
/* ======================= BASE ELEM ======================================== */
export function getElem() {
    return basic.getElem(...arguments);
}
// TODO. DRY
export function getSelect() {
    return basic.getSelect(...arguments);
}
/* ====================== BUILDERS ========================================== */
/* ----------------------- FOOTER ------------------------------------------- */
export function getFormFooter() {
    return footer.getFormFooter(...arguments);
}
/* --------------------- INPUT FIELD ------------------------------------------- */
export function getFieldElems() {
    return field.getFieldElems(...arguments);
}
/* ------------------------ INPUT ------------------------------------------- */
export function getFieldInput() {
    return input.getFieldInput(...arguments);
}
export function buildMultiSelectInput() {
    return input.buildMultiSelectInput(...arguments);
}
/* ---------------------- FORM-ROW ------------------------------------------- */
