/**
 * Handles individual Entity edit forms. 
 *
 * Exports:             Imported by:
 *     editEntity       forms-main
 */
import * as _i from '../forms-main.js';

/** Shows the entity's edit form in a pop-up window on the search page. */
export function editEntity(id, entity) {                                        console.log("       //showEntityEditForm [%s] [%s]", entity, id);                  console.log("Editing [%s] [%s]", entity, id);  
    initEditForm(id, entity)
    .then(() => _i.entity('finishEditFormInit', [entity, id]))
    .catch(err => _i.util('alertErr', [err]));;
}
/** Inits the edit top-form, filled with all existing data for the record. */
function initEditForm(id, entity) {  
    return getEditFormFields(id, entity)
        .then(fields => _i.elems('buildAndAppendTopForm', [fields, id]))
        .then(hideFieldCheckboxes)
        .then(() => finishEditFormBuild(entity))
        .then(() => fillFormWithEntityData(entity, id));
}   
function hideFieldCheckboxes() {
    $('.top-pin').addClass('invis');
    return Promise.resolve();
}
/** Returns the form fields for the passed entity.  */
function getEditFormFields(id, entity) {
    _i.mmry('setFormProp', ['top', 'expanded', true]); //All possible fields are shown in edit fields.
    return buildEditFields(entity, id);
    // const fieldBldr = getEditFormFieldBuilder(entity);
    // return fieldBldr(entity, id);
}   
function buildEditFields(entity, id) {
    const complxBldrs = { 
        'citation': 'getSrcTypeFields', 'publication': 'getSrcTypeFields',
        'taxon': 'getTaxonEditFields' 
    };  
    return complxBldrs[entity] ? getCmplxEditFields() : getEditFields(entity, id);  

    function getCmplxEditFields() {
        return _i.entity(complxBldrs[entity], [entity, id]);
    }
}
/** Returns the passed entity's form fields. */
function getEditFields(entity, id) {
    const formConfg = _i.confg('getFormConfg', [entity]);
    return _i.elems('getFormFieldRows', [entity, {}, 'top']);
}
function finishEditFormBuild(entity) {
    const cmplx = ['citation', 'interaction', 'location', 'taxon'];
    return cmplx.indexOf(entity) > -1 ? finishCmplxForm() : finishEditForm(entity);

    function finishCmplxForm() {
        return _i.entity('finishEntityEditFormBuild', [entity]);
    }
}
function finishEditForm(entity) {
    _i.entity('initFormCombos', [entity, 'top']);
    $('.all-fields-cntnr').hide();  //Hide the "Show all fields" checkbox
    return Promise.resolve();
}
/*------------------- Fills Edit Form Fields -----------------------------*/
/** Fills form with existing data for the entity being edited. */
// function fillFormWithCurrentEntityData(entity, id) {
//     if (entity == 'interaction') { return fillInteractionData(id); }
//     fillFormWithEntityData(entity, id);
// }
// function fillInteractionData(id) {
//     _i.util('getData', ['interaction'])
//     .then(ints => {
//         fP.records.interaction = ints;
//         fillFormWithEntityData('interaction', id)
//     });
// }
function fillFormWithEntityData(entity, id) {
    addDisplayNameToForm(entity, id);
    fillEntityData(entity, id)
    // _i.entity('fillEditFormData', [entity, id])
    .then(checkFieldsAndToggleSubmit);
    // fillEntityData(entity, id); 
    // if (_elems.ifAllRequiredFieldsFilled('top')) { 
    //     _i.ui('toggleSubmitBttn', ['#top-submit', true]); 
    // }
}
function addDisplayNameToForm(ent, id) {
    if (ent === 'interaction') { return; }
    const prnt = _i.confg('getParentEntity', [ent]);
    const entity = prnt || ent;
    const rcrd = _i.mmry('getRcrd', [entity, id]);                                           
    $('#top-hdr')[0].innerText += ': ' + rcrd.displayName; 
    $('#det-cnt-cntnr span')[0].innerText = 'This ' + ent + ' is referenced by:';
}


/** Note: Source types will get their record data at fillSrcData. */
function fillEntityData(ent, id) {  
    const hndlrs = { 'author': fillSrcData, 'citation': fillSrcData,
        'location': fillLocData, 'publication': fillSrcData, 
        'publisher': fillSrcData, 'taxon': fillTaxonData, 
        'interaction': fillIntData };
    const rcrd = _i.mmry('getRcrd', [ent, id]);                                              console.log("   --fillEntityData [%s] [%s] = %O", ent, id, rcrd);
    return Promise.resolve(hndlrs[ent](ent, id, rcrd));
    // return complxFills[entity] ? fillCmplxEditFields() : fillEditFields(entity, id);  

    // function getCmplxEditFields() {
    //     return _i.entity(complxBldr[entity], [entity, id]);
    // }
}
// function ifHasDetailEntity(entity) {
//     const wDetail = ['author', 'citation', 'location', 'publication', 'publisher'];
//     return wDetail.indexOf(entity) !== -1;
// }
function updateEditDetailMemory(detailId) {
    const editObj = _i.mmry('getMemoryProp', ['editing']);
    editObj.detail = detailId;
    _i.mmry('setMemoryProp', ['editing', editObj]);
}
function fillIntData(entity, id, rcrd) {  
    const fields = getInteractionFieldFillTypes();  
    fillFields(rcrd, fields, true);
}
function getInteractionFieldFillTypes() {
    const fieldTypes = _i.confg('getCoreFieldDefs', ['interaction']);
    ['Publication', 'CitationTitle'].forEach(f => delete fieldTypes[f]);
    ['Subject', 'Object'].forEach(f => fieldTypes[f] = 'taxon');
    fieldTypes.Source = 'source';
    return fieldTypes;
}
function fillLocData(entity, id, rcrd) {
    const fields = _i.confg('getCoreFieldDefs', [entity]);  
    handleLatLongFields();
    fillFields(rcrd, fields);
    _i.panel('fillRelationalDataInPanel', [entity, rcrd]);
    // fP.editing.detail = rcrd.geoJsonId || null;
    if (rcrd.geoJsonId) { 
        updateEditDetailMemory(rcrd.geoJsonId);
        storeLocGeoJson(rcrd.geoJsonId); 
    }
    
    /* Sets values without triggering each field's change method. */
    function handleLatLongFields() {
        delete fields.Latitude;
        delete fields.Longitude;
        delete fields.Country;
        $('#Latitude_row input').val(rcrd.latitude);
        $('#Longitude_row input').val(rcrd.longitude);
        _i.cmbx('setSelVal', ['#Country-sel', rcrd.country.id, 'silent']);
    }
    function storeLocGeoJson(id) {
        return _i.util('getData', ['geoJson'])
            .then(data => _i.mmry('setFormProp', ['top', data[id]]));
    }
} /* End fillLocData */
function fillTaxonData(entity, id, rcrd) {                                      //console.log('fillTaxonData. rcrd = %O', rcrd)
    _i.panel('fillRelationalDataInPanel', [entity, rcrd]);
}
/** Fills all data for the source-type entity.  */
function fillSrcData(entity, id, rcrd) { 
    const src = _i.mmry('getRcrd', ['source', id]);
    const detail = _i.mmry('getRcrd', [entity, src[entity]]);                     //console.log("fillSrcData [%s] src = %O, [%s] = %O", id, src, entity, detail);
    const fields = getSourceFields(entity);                                       //console.log('fields = %O', fields)
    setSrcData();
    setDetailData();
    
    function setSrcData() {
        fillFields(src, fields.core);
        _i.panel('fillRelationalDataInPanel', [entity, src]);            
    }
    function setDetailData() {
        fillFields(detail, fields.detail);
        setAdditionalFields(entity, src, detail);
        updateEditDetailMemory(detail.id);
    }
    // fillAllSrcData()
    // loadSourceTypeFields()
    // .then(fillAllSrcData);

    // function loadSourceTypeFields() {
    //     if (['citation', 'publication'].indexOf(entity) == -1) { return Promise.resolve(); }
    //     const type = getDetailTypeDataObj();
    //     const typeElem = $('#'+_i.util('ucfirst'[entity])+'Type-sel')[0];
    //     return _i.loadSrcTypeFields(entity, type.id, typeElem, type.name);
    // }
    // function getDetailTypeDataObj() {
    //     const typeProp = entity == 'citation' ? 'citationType' : 'publicationType';
    //     return {
    //         typeId: detail[typeProp].id,
    //         typeName: detail[typeProp].displayName
    //     };
    // }
    // function fillAllSrcData() {
    // }
} /* End fillSrcData */
function getSourceFields(entity) {
    return { 
        core: _i.confg('getCoreFieldDefs', [entity]), 
        detail: _i.confg('getFormConfg', [entity]).add 
    };
}

function setAdditionalFields(entity, srcRcrd, detail) {
    if (["publication", "citation"].indexOf(entity) === -1) { return; }
    setTitleField(entity, srcRcrd);
    setPublisherField(entity, srcRcrd);
    setCitationEdgeCaseFields(entity, detail);
}
function setTitleField(entity, srcRcrd) {                                       //console.log("setTitleField [%s] rcrd = %O", entity, srcRcrd)
    const name = entity === 'publication' ? 
        srcRcrd.displayName : getCitTitle(srcRcrd.citation);
    $('#Title_row input[type="text"]').val(name).change();

    function getCitTitle(citId) {
        return _i.mmry('getRcrd', ['citation', citId]).displayName;
    }
} /* End setTitleField */
function setPublisherField(entity, srcRcrd) { 
    if (!_i.ui('ifFieldIsDisplayed', ['Publisher', 'top'])) { return; }    
    _i.cmbx('setSelVal', ['#Publisher-sel', srcRcrd.parent]);
}
function setCitationEdgeCaseFields(entity, citRcrd) {
    if (entity !== 'citation') { return; }
    $('#CitationText_row textarea').val(citRcrd.fullText);
    $('#Issue_row input[type="text"]').val(citRcrd.publicationIssue);
    $('#Pages_row input[type="text"]').val(citRcrd.publicationPages);
    $('#Volume_row input[type="text"]').val(citRcrd.publicationVolume);
}
/** ----------- Shared ---------------------------- */
function checkFieldsAndToggleSubmit() {
    if (_i.elems('ifAllRequiredFieldsFilled', ['top'])) { 
        _i.ui('toggleSubmitBttn', ['#top-submit', true]); 
    }
}
function fillFields(rcrd, fields) {                                             console.log('       --fillEditFields. rcrd = %O, fields = %O', rcrd, fields);
    const fieldHndlrs = {
        'text': setText, 'textArea': setTextArea, 'select': setSelect, 
        'fullTextArea': setTextArea, 'multiSelect': setMultiSelect,
        'tags': setTagField, 'cntry': setCntry, 'source': addSource, 
        'taxon': addTaxon
    };
    for (let field in fields) {                                                 //console.log('------- Setting field [%s]', field);
        addDataToField(field, fieldHndlrs[fields[field]], rcrd);
    }  
}
function ifFieldInForm(field) {
    return _i.ui('ifFieldIsDisplayed', [field, 'top']);
}
function addDataToField(field, fieldHndlr, rcrd) {                              //console.log("addDataToField [%s] [%O] rcrd = %O", field, fieldHndlr, rcrd);
    const elemId = field.split(' ').join('');
    const prop = _i.util('lcfirst', [elemId]);
    fieldHndlr(elemId, prop, rcrd);
}
/** Adds multiSelect values to the form's val object. */
function setMultiSelect(fieldId, prop, rcrd) {                                  //console.log("setMultiSelect [%s] [%s] rcrd = %O", fieldId, prop, rcrd);
    if (!rcrd[prop] || !ifFieldInForm(fieldId)) { return; }
    const ucProp = _i.util('ucfirst', [prop]);
    _i.mmry('setFormFieldData', ['top', ucProp, rcrd[prop]]);
    if (!$('#'+ucProp+'-sel-cntnr').length) { return; } //can this be the first line here?
    _i.entity('selectExistingAuthors', [ucProp, rcrd[prop], 'top']);
}
function setText(fieldId, prop, rcrd) {                                         //console.log("setTextField [%s] [%s] rcrd = %O", fieldId, prop, rcrd);
    $('#'+fieldId+'_row input').val(rcrd[prop]).change();   
}
function setTextArea(fieldId, prop, rcrd) {
    $('#'+fieldId+'_row textarea').val(rcrd[prop]).change();   
}
function setSelect(fieldId, prop, rcrd) {                                       //console.log("setSelect [%s] [%s] rcrd = %O", fieldId, prop, rcrd);
    const id = rcrd[prop] ? rcrd[prop].id ? rcrd[prop].id : rcrd[prop] : null;
    _i.cmbx('setSelVal', ['#'+fieldId+'-sel', id]);
}
function setTagField(fieldId, prop, rcrd) {                                     //console.log("setTagField. rcrd = %O", rcrd)
    const tags = rcrd[prop] || rcrd.tags;
    tags.forEach(tag => _i.cmbx('setSelVal', ['#'+fieldId+'-sel', tag.id]));
}    
function setCntry(fieldId, prop, rcrd) { 
    _i.cmbx('setSelVal', ['#Country-sel', rcrd.country.id]);
}










function addTaxon(fieldId, prop, rcrd) {       
    const selApi = $('#'+ fieldId + '-sel')[0].selectize;
    const taxon = _i.mmry('getRcrd', ['taxon', rcrd[prop]]);                          
    selApi.addOption({ value: taxon.id, text: _i.getTaxonDisplayName(taxon) });
    selApi.addItem(taxon.id);
}
function addSource(fieldId, prop, rcrd) {
    const citSrc = _i.mmry('getRcrd', ['source', rcrd.source]) 
    _i.cmbx('setSelVal', ['#Publication-sel', citSrc.parent]);
    _i.cmbx('setSelVal', ['#CitationTitle-sel', rcrd.source]);
}
/* ---- On Form Fill Complete --- */
// function onEditFormFillComplete(id, entity) {                                       //console.log('onEditFormFillComplete. entity = ', entity);
//     const map = { 
//         'citation': setSrcEditRowStyle, 'location': _i.addMapToLocationEditForm, 
//         'publication': setSrcEditRowStyle };
//     if (!map[entity]) { return; }
//     map[entity](id);
// }

/*-------- Edit Taxon Methods ----------*/
/*-------- Edit Citation Methods ----------*/
/*-------- Edit Location Methods ----------*/