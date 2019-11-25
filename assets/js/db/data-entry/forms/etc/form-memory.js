/**
 *
 *
 *
 * Exports:             Imported by:
 *     getFormEntity            forms-main
 *     initFormMemory           forms-main
 *     initEntityFormMemory     
 */
import { getData, snapshot } from '../../../util.js';
import * as _forms from '../forms-main.js';

let formMemory = {};

export function clearMemory() {
    formMemory = {};
}
/*--------------------- INIT FORM MEMORY -------------------------------------*/
/**
 * -- Property descriptions:
 * > action - ie, Create, Edit.
 * > editing - Container for the id(s) of the record(s) being edited. (Detail 
        ids are added later). False if not editing.
 * > entity - Name of this form's entity     
 * > forms - Container for form-specific params 
 * > formLevels - An array of the form level names/tags/prefixes/etc.
 * > records - An object of all records, with id keys, for each of the 
 *   root entities - Location, Source and Taxa, and any sub entities as needed.
 * > submitFocus - Stores the table-focus for the entity of the most recent 
        form submission. Will be used on form-exit.
 */
export function initFormMemory(action, entity, id) {  
    const  entities = ['source', 'location', 'taxon', 'citation', 'publication', 
        'author', 'publisher'];
    const prevSubmitFocus = formMemory.submitFocus;
    // const xpandedForms = formMemory.forms ? formMemory.forms.expanded : {};
    return getData(entities).then(data => {
        initMainMemory(data);
        initEntityFormMemory(entity, 'top', null, action);                      console.log("#### Init formMemory = %O, curFormMemory = %O", snapshot(formMemory), formMemory);
        return formMemory;
    });

    function initMainMemory(data) {
        formMemory = {
            action: action,
            editing: action === 'edit' ? { core: id || null, detail: null } : false,
            entity: entity,
            forms: {},  // expanded: xpandedForms 
            formLevels: ['top', 'sub', 'sub2'],
            records: data,
            submitFocus: prevSubmitFocus || false
        };
    }
}
/**
 * Adds the properties and confg that will be used throughout the code for 
 * generating, validating, and submitting sub-form. 
 * -- Property descriptions:
 * > action - create || edit
 * > confg - The form config object used during form building.
 * > expanded - show all fields (true) or show default.
 * > fieldConfg - Form fields and types, values entered, and the required fields.
 * > entity - Name of this form's entity.
 * > entityType - Sub-entity type. Eg, publication-types: Book, Journal, etc.
 * > onFormClose - Handles form exit/reset.
 * > fieldConfg - Form fields and types, values entered, and the required fields.
 * > misc - object to hold the various special-case props
 * > pSelId - The id of the parent select of the form.
 * > reqElems - All required elements in the form.
 * > selElems - Contains all selElems until they are initialized with selectize.
 * > vals - Stores all values entered in the form's fields.
 * --- Misc entity specific properties
 * > Citation forms: rcrds - { src: pubSrc, pub: pub } (parent publication)
 * > Location forms: geoJson - geoJson entity for this location, if it exists.
 * > Taxon forms: taxonPs - added to formMemory.forms (see props @initTaxonParams)
 */
export function initEntityFormMemory(entity, level, pSel, action) {       
    formMemory.forms[entity] = level;
    formMemory.forms[level] = {
        action: action,
        expanded: false,
        fieldConfg: { fields: {}, order: [], required: [] }, //refactor away from here??
        entity: entity,
        entityType: false,
        onFormClose: null,
        misc: {},
        pSelId: pSel,
        reqElems: [],
        selElems: [], 
        vals: {}
    };                                                                          console.log("initEntityFormMemory. formMemory = %O, arguments = %O", formMemory, arguments)
    return formMemory;                                                                       
}
/*------------- Taxon --------------------*/
/**
 * Inits the taxon params object.
 * > lvls - All taxon levels
 * > realm - realm taxon display name
 * > realmLvls - All levels for the selected realm
 * > curRealmLvls - Levels present in selected realm.
 * > realmTaxon - realm taxon record
 * > prevSel - Taxon already selected when form opened, or null.
 * > objectRealm - Object realm display name. (Added elsewhere.)
 */
export function initTaxonMemory(role, realmName, realmTaxon, reset) {           //console.log('###### INIT ######### role [%s], realm [%s]', role, realmName);
    const realmLvls = {                                             //realm-refact
        'Bat': ['Order', 'Family', 'Genus', 'Species'],
        'Arthropod': ['Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'],
        'Plant': ['Kingdom', 'Family', 'Genus', 'Species']
    };
    return Promise.resolve(buildBaseTaxonParams());

    function buildBaseTaxonParams() {                                           
        formMemory.forms.taxonPs = { 
            lvls: ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'],  //realm-refact
            realm: realmName, 
            allRealmLvls: realmLvls, 
            curRealmLvls: realmLvls[realmName],
            realmTaxon: realmTaxon,
        };           
        if (role === 'Object') { formMemory.forms.taxonPs.objectRealm = realmName; }  
        console.log('       --taxon params = %O', formMemory.forms.taxonPs)
    }
}
/** Returns either the preivously selected object realm or the default. */
export function getObjectRealm() {
    const txnMemory = formMemory.forms.taxonPs; 
    return !txnMemory ? 'Plant' : (txnMemory.objectRealm || 'Plant');
}   
// /* ---------------------------- Getters ------------------------------------- */
export function isEditForm() {
    return formMemory.action === 'edit';
}
export function getEditEntityId(type) {
    return formMemory.editing[type];
}
export function getAllFormMemory() {
    return formMemory;
}
export function getMemoryProp(prop) {
    return formMemory[prop];
}
/* source-forms */
export function getFormMemory(fLvl) {
    return formMemory.forms[fLvl] ? formMemory.forms[fLvl] : false;
}
export function getFormProp(prop, fLvl) {                                       //console.log('args = %O, memory = %O', arguments, formMemory); 
    return formMemory.forms[fLvl] ? formMemory.forms[fLvl][prop] : false;
}
export function getFormEntity(fLvl) { 
    return formMemory.forms[fLvl] ? formMemory.forms[fLvl].entity : false;
}
export function getFormParentId(fLvl) {
    return formMemory.forms[fLvl] ? formMemory.forms[fLvl].pSelId : false;
}
export function getTaxonProp(prop) {  
    return formMemory.forms.taxonPs[prop];
}
export function getTaxonMemory() {
    return formMemory.forms.taxonPs;
}
// export function getFormLevelParams(fLvl) {
//     return formMemory.forms[fLvl];
// }
export function getFormFieldConfg(fLvl, field) {
    return formMemory.forms[fLvl].vals[field];
}
export function getEntityRcrds(entity) {
    return typeof entity == 'string' ? formMemory.records[entity] : buildRcrdsObj(entity);
}
function buildRcrdsObj(entities) {
    const rcrds = {};
    entities.forEach(ent => { rcrds[ent] = formMemory.records[entity]});
    return rcrds;
}/** Returns the record for the passed id and entity-type. */
export function getRcrd(entity, id) {                                           
    if (!formMemory.records[entity]) { return; }
    const rcrd = formMemory.records[entity][id];
    if (!rcrd) { return console.log('!!!!!!!! No [%s] found in [%s] records = %O', id, entity, formMemory.records); console.trace() }
    return _forms._util('snapshot', [formMemory.records[entity][id]]); 
}
/* ---------------------------- Setters ------------------------------------- */
export function addEntityRecords(entity, rcrds) {
    formMemory.records[entity] = rcrds;
}
export function addFormSubmitProps(propObj) {
    formMemory.submit = propObj;
}
export function addRequiredFieldInput(fLvl, input) {  
    formMemory.forms[fLvl].reqElems.push(input);
}
export function addComboToMemory(fLvl, field) {                                 //console.log('addComboTo[%s]Memory [%s]', fLvl, field);
    formMemory.forms[fLvl].selElems.push(field);    
}
export function setMemoryProp(prop, val) {
    formMemory[prop] = val;
}
export function setFormMemory(fLvl, params) {
    formMemory.forms[fLvl] = params;
}
export function setFormProp(fLvl, prop, val) {
    formMemory.forms[fLvl][prop] = val;
}
export function setTaxonProp(prop, val) {  
    return formMemory.forms.taxonPs[prop] = val;
}
export function setFormFieldConfg(fLvl, field, confg) {
    formMemory.forms[fLvl].vals[field] = confg
}
export function setFormFieldValueMemory(fLvl, field, val) {
    formMemory.forms[fLvl].vals[field].val = val;
}
export function setFormEntityType(fLvl, type) {
    formMemory.forms[fLvl].entityType = type;
}
export function setonFormCloseHandler(fLvl, hndlr) { //fix capitalization
    formMemory.forms[fLvl].onFormClose = hndlr;
}