/**
 * Entry point for entity-specific code.
 *
 * Note - required form methods: initCreateForm, initFormCombos
 *
 * CODE SECTIONS
 *     CREATE ENTITY
 *     AUTHOR
 *     CITATION
 *     LOCATION
 *     PUBLICATION
 *     PUBLISHER
 *     TAXON
 */
import * as _i from '../forms-main.js'; 
import * as _int from './interaction-form.js';
import * as _loc from './location-form.js';
import * as _src from './source-forms.js';
import * as _txn from './taxon-form.js';
import * as _autoCite from './auto-citation.js';

const forms = {
    'author': _src, 'citation': _src, 'interaction': _int, 'location': _loc,
    'publication': _src, 'publisher': _src, 'taxon': _txn, 'subject': _int, 
    'object': _int, 'species': _txn, 'genus': _txn, 'family': _txn, 'order': _txn, 
    'class': _txn
};

export function createEntity(entity, name) {                                    //console.log('createEntity. args = %O', arguments)
    return forms[entity].initCreateForm(entity, name);    
}
export function initFormCombos(entity, fLvl) {
    forms[entity].initFormCombos(entity, fLvl);
}
/* ---- EDIT FORMS --- */
export function finishEntityEditFormBuild(entity) {
    return Promise.resolve(
        forms[entity].finishEditFormBuild(entity));
}
// export function fillEditFormData(entity, coreRcrd, detRcrd) {
//     const cmplxFills = {
//         'citation': _src.fillCmplxCitationFields,
//         'publication': _src.fillCmplxPublicationFields
//     };
//     return Promise.resolve(cmplxFills[entity](coreRcrd, detRcrd));
// }
export function finishEditFormInit(entity, id) {
    const cmplxFnshrs = {
        'citation': _src.setSrcEditRowStyle, 
        'publication': _src.setSrcEditRowStyle, 
        'location': addMapToLocationEditForm, 
    };
    if (!cmplxFnshrs[entity]) { return Promise.resolve(); }
    return Promise.resolve(cmplxFnshrs[entity](id));
}
/** --------------------------- AUTHOR -------------------------------------- */
/* edit-form, form-ui */
export function selectExistingAuthors() {
    return _src.selectExistingAuthors(...arguments);
}
/** --------------------------- CITATION ------------------------------------ */
export function handleCitText(formLvl) {
    // if (_i.mmry('getFormProp', [formLvl, 'entity']) !== 'citation') { return; }
    _src.handleCitText(formLvl);
}
export function getCitationText(fLvl) {
    return _autoCite.getCitationText(fLvl);
}
export function rebuildCitationText(params) {
    return _autoCite.rebuildCitationText(params);
}
/** ------------------------ INTERACTION ------------------------------------ */
export function fillCitationField() {
    _int.fillCitationField(...arguments);
}
export function selectIntLoc(id) {
    _int.selectLoc(id);
}
export function enableCountryRegionField() {
    _int.enableCountryRegionField();
}
/** --------------------------- LOCATION ------------------------------------ */
export function addMapToLocationEditForm() {
    return _loc.addMapToLocationEditForm(...arguments);
}
export function addMapToLocForm(elem, mapType) {
    return _loc.addMapToLocForm(elem, mapType);
}
export function focusParentAndShowChildLocs(mapType, val) {
    return _loc.focusParentAndShowChildLocs(mapType, val);
}
export function addNewLocationWithGps() {
    _loc.addNewLocationWithGps();
}
/** ------------------------ TAXON ------------------------------------------ */
export function createTaxon(level, val) {
    return _txn.initCreateForm(level, val);
}
export function getSelectedTaxon() {
    return _int.getSelectedTaxon();
}
export function getTaxonEditFields(entity, id) {
    return _txn.getTaxonEditFields(id);
}
export function selectParentTaxon(id) {
    return _txn.selectParentTaxon(id);
}
/** ------------------------ SOURCE TYPES ----------------------------------- */
export function loadSrcTypeFields(subEntity, typeId, elem, typeName) {
    return _src.loadSrcTypeFields(subEntity, typeId, elem, typeName);
}
export function onSrcToggleFields() {
    _src.finishSourceToggleAllFields(...arguments);
}
export function getSrcTypeFields(subEntity, typeId) {
    return _src.getSrcTypeFields(subEntity, typeId);
}