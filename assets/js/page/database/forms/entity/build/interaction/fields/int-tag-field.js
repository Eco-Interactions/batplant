/**
 * Mangages the Interaction Type and Interaction Tag fields in the interaction form.
 *
 * Export
 *     clearTypeTagData
 *     initTagField
 *     loadInteractionTypeTags
 *     onTagSelection
 *
 * TOC
 *     INTERACTION TYPE
 *         BUILD VALID OPTIONS
 *         LOAD OPTIONS
 *     INTERACTION TAG
 *         CLEAR TYPE-TAGS
 *         INIT TAG FIELD
 *         ON TAG SELECTION
 *     SHARED
 *         FIELD INIT-VAL
 */
import { _cmbx } from '~util';
import { _confg, _state } from '~form';
import * as iForm from '../int-form-main.js';
/**
 * defaultTagOpts:  These tags are always valid and available to select.
 * object:          Object-taxon subGroup id
 * subject:         Subject-taxon subGroup id
 * validInts:       Valid interaction ids for the selected subject and object groups
 */
let md = getTagFieldDefaultState();

export function resetTagState() {
    md = getTagFieldDefaultState();
}
function getTagFieldDefaultState() {
    return {
        defaultTagOpts: [],
        autoTag: null,
        validInts: {}
    };
}
/* ======================== INIT DEFAULT-TAGS =============================== */
/** Loads the default interaction tags (eg. 'Secondary') and enables the combobox. */
export function initTagField() {
    const tags = _state('getEntityRcrds', ['tag']);
    const defaults = _state('getFieldState', ['top', 'InteractionTags', 'misc']).defaultTags;
    md.defaultTagOpts = Object.keys(tags).map(ifDefaultTagGetOpt).filter(o=>o);
    loadTagOpts(md.defaultTagOpts);

    function ifDefaultTagGetOpt(id) {
        if (defaults.indexOf(tags[id].displayName) === -1) { return null; }
        return { text: tags[id].displayName, value: id }
    }
}
/* =================== CLEAR INTERACTION-TYPE TAGS ========================== */
export function clearTypeTagData() {
    loadTagOpts(md.defaultTagOpts);
    md.autoTag = null;
    _state('setFieldState', ['top', 'InteractionTags', false, 'required']);
}
/* ==================== LOAD INTERACTION-TYPE TAGS ========================== */
export function loadInteractionTypeTags(tags) {
    handleRequiredTag(tags[0].id, tags.length);
    addTypeTagOpts(tags);
}
/* -------------------------- REQUIRED TAG ---------------------------------- */
/**
 * If the selected ValidInteraction has one tag, that tag is required and will be
 * autofilled. If there is more than one, at least one is required.
 * @param  {array} typeTags  Tags for the selected ValidInteraction type
 */
function handleRequiredTag(tagId, count) {
    const isRequired = !!count;
    md.autoTag = count === 1 ? tagId : null;
    _state('setFieldState', ['top', 'InteractionTags', isRequired, 'required']);
}
function addTypeTagOpts(typeTags) {                                 /*dbug-log*///console.log('addTypeTagOpts typeTags = %O', typeTags);
    loadTagOpts(buildTagOpts(typeTags));
}
/* ------------------------ BUILD TAG-OPTS ---------------------------------- */
function buildTagOpts(typeTags) {
    const opts = typeTags.map(getTagOpt).concat(md.defaultTagOpts);
    return _cmbx('alphabetizeOpts', [opts]);
}
function getTagOpt(tag) {
    return { text: tag.displayName, value: tag.id };
}
/* ------------------------- LOAD TAG-OPTS ---------------------------------- */
function loadTagOpts(opts) {
    const selected = _cmbx('getSelVal', ['InteractionTags']).filter(ifDefaultTag);/*dbug-log*///console.log('loadTagOpts = %O, selectedDefaults = %O', opts, selected);
    _cmbx('replaceSelOpts', ['InteractionTags', opts]);
    afterTypeTagsLoaded(selected);
}
function ifDefaultTag(id) {
    return md.defaultTagOpts.some(o => o.value == id);
}
/* ---------------------- AFTER TYPE-TAGS LOAD ------------------------------ */
function afterTypeTagsLoaded(selectedDefaults) {
    const vals = [getInitVal(), md.autoTag, ...selectedDefaults].filter(t=>t);/*dbug-log*///console.log('afterTypeTagsLoaded select = %O', vals);
    if (!vals.length) { return; }
    _cmbx('setSelVal', ['InteractionTags', vals]);
}
/**
 * Init-val is set when tag data is persistsed into a new interaction, and during
 * edit-form build to fill the field with record data.
 */
function getInitVal() {
    const initVal = $('#sel-InteractionTags').data('init-val');
    return initVal ? initVal : null;
}
/* ====================== ON TAG SELECTION ================================== */
export function onTagSelection(tags) {                              /*dbug-log*///console.log('tags = ', tags);
    ensureDefaultTagStaysSelected(tags);
    iForm.checkIntFieldsAndEnableSubmit();
}
function ensureDefaultTagStaysSelected(tags) {
    if (!md.autoTag || tags.indexOf(md.autoTag) !== -1 ) { return; }
    $('#sel-InteractionTags')[0].selectize.addItem(md.autoTag, 'silent');
}