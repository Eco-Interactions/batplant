/**
 * Taxon edit-form.
 *
 * TOC
 *     FIELDS
 *     NAME FIELD AND RANK COMBOBOX
 *     PARENT TAXON ELEMS
 *         TAXON PARENT SELECT FORM
 *         RANK COMBO ELEMS
 *         FINISH SELECT FORM BUILD
 *         DATA VALIDATION
 *     ROW BUILDERS
 *     FINISH EDIT FORM BUILD
 *     DATA VALIDATION
 */
import { _cmbx, _el, _u } from '~util';
import { _state, _elems, _form, _val, formatAndSubmitData } from '~form';
import * as tForm from '../txn-form-main.js';

let taxonData;
/**
 * Returns the elements of the edit-taxon form.
 * <div>Parent Taxon: [Rank][Display-name]</> <bttnInput>"Edit Parent"</>
 * <select>[Taxon-rank]</>    <input type="text">[Taxon Display-name]</>
 *     <button>Update Taxon</> <button>Cancel</>
 */
export function getTaxonEditFields(id) {
    const taxa = _state('getEntityRcrds', ['taxon']);
    const group = taxa[id].group;
    const role = group.displayName === 'Bat' ? 'Subject' : 'Object';
    return _state('initTaxonState', [role, group.id, group.subGroup.name])
        .then(groupState => {
            setScopeTaxonMemory(taxa, groupState);
            return buildTaxonEditFields(taxa[id]);
        });
}
function setScopeTaxonMemory(taxaRcrds, groupState) {
    taxonData = groupState;
    taxonData.rcrds = taxaRcrds;
}
/** ======================== FIELDS ========================================= */
function buildTaxonEditFields(taxon) {
    const txnElems = getEditTaxonFields(taxon);
    const prntElems = getPrntTaxonElems(taxon);
    return prntElems.concat(txnElems);
}
/** ----------------- NAME FIELD AND Rank COMBOBOX ------------------------- */
function getEditTaxonFields(taxon) {                                /*dbug-log*///console.log("getEditTaxonFields for [%s]", taxon.displayName);
    const input = buildNameInput(taxon.name);
    const rankSel = buildRankSel(taxon);
    return [ buildTaxonEditFormRow('Taxon', [rankSel, input], 'top')];
}
/** ----------- NAME INPUT --------------- */
function buildNameInput(name) {
    const attr = { id: 'txn-name', type: 'text', value: name };
    return _el('getElem', ['input', attr]);
}
/** ------- RANK COMBOBOX --------------- */
function buildRankSel(taxon) {
    const opts = getTaxonRankOpts();
    const sel = _el('getSelect', [opts, { id: 'sel-Rank' }]);
    $(sel).data({ 'txn': taxon.id, 'rank': getRankVal(taxon.rank.displayName) });
    return sel;
}
function getRankVal(rank) {
    return taxonData.ranks[rank].ord;
}
/** Returns an array of options for the ranks in the taxon's group. */
function getTaxonRankOpts() {
    return taxonData.groupRanks.reverse().map(rank => {
        return { text: rank, value: taxonData.ranks[rank].ord};
    });
}
/** ----------------- PARENT TAXON ELEMS ------------------------------------ */
/**
 * <div>Taxon Parent: [parent name]</> <button>Change Parent</>
 * Button calls @showParentTaxonSelectForm.
 */
function getPrntTaxonElems(taxon) {                                 /*dbug-log*///console.log("getPrntTaxonElems for %O", taxon);
    const prnt = taxonData.rcrds[taxon.parent];
    const elems = [ buildNameElem(prnt), buildEditPrntBttn(prnt)];
    return [ buildTaxonEditFormRow('Parent', elems, 'top')];
}
/** ----------- PARENT TAXON NAME --------------- */
function buildNameElem(prnt) {
    const div = _el('getElem', ['div', { id: 'txn-prnt' }]);
    setTaxonPrntNameElem(prnt, div);
    $(div).css({'padding-top': '4px'});
    return div;
}
function setTaxonPrntNameElem(prnt, elem, pText) {
    const div = elem || $('#txn-prnt')[0];
    const text = pText || prnt.displayName;
    div.innerHTML = '<b>Taxon Parent</b>: <span>&nbsp ' + text + '</span>';
    $(div).data('txn', prnt.id).data('rank', getRankVal(prnt.rank.displayName));
}
/** ----------- CHANGE PARENT BUTTON --------------- */
function buildEditPrntBttn(prnt) {
    const attr = { type: 'button', value: 'Change Parent', id: 'chng-prnt',
        class: 'ag-fresh' };
    const bttn = _el('getElem', ['input', attr]);
    $(bttn).click(showParentTaxonSelectForm);
    return bttn;
}
/** ============= TAXON PARENT SELECT FORM ================================== */
/**
 * <select>[Group Ranks]</> <select>[Taxa at selected rank]</>
 * Changing the rank select repopulates the taxon select with taxa at this rank.
 * Entering a taxon that does not already exists will open the 'create' form.
 * Current parent data is selected upon init.
 */
function showParentTaxonSelectForm() {
    buildParentTaxonEditElems($('#txn-prnt').data('txn'))
    .then(appendPrntFormElems)
    .then(finishSelectPrntFormBuild);
}
/** ------------------- RANK COMBO ELEMS ------------------------------------ */
function buildParentTaxonEditElems(pId) {
    const prnt = taxonData.rcrds[pId];
    const hdr = [ buildEditParentHdr()];
    const bttns = [ _elems('getFormFooter', ['taxon', 'sub', 'edit'])];
    return getParentEditFields(prnt)
        .then(fields => hdr.concat(fields, bttns));
}
function buildEditParentHdr() {
    const attr = { text: 'Select New Taxon Parent', id:'sub-hdr' };
    return _el('getElem', ['h3', attr]);
}
function getParentEditFields(prnt) {
    const group = _u('lcfirst', [prnt.group.displayName]);
    _state('addEntityFormState', [group, 'sub', null, 'edit']);
    return _elems('buildFormRows', ['object', {}, 'sub', null])
        .then(modifyAndReturnPrntRows);

    function modifyAndReturnPrntRows(rows) {                        /*dbug-log*///console.log('modifyAndReturnPrntRows = %O', rows);
        removeTaxonGroupRow(rows);
        const groupSelRow = getGroupRankRow(prnt, rows);
        return [groupSelRow, rows].filter(r=>r);
    }
}
function removeTaxonGroupRow(rows, field = 'Group') {
    $(rows)[0].removeChild($(rows)[0].childNodes[0]);
    _state('removeSelFromStateMemory', ['sub', field]);
}
/** ------- GROUP DISPLAY NAME ------ */
function getGroupRankRow(taxon, rows) {
    const subGroups = Object.keys(taxonData.subGroups);
    if (subGroups.length > 1) { return; }
    removeTaxonGroupRow(rows, 'Sub-Group');
    return buildTaxonParentRow(taxonData.subGroups[subGroups[0]].displayName);
}
function buildTaxonParentRow(displayName) {
    const groupRank = displayName.split(' ')[0];
    const lbl = _el('getElem', ['label', { text: groupRank }]);
    const groupParent = buildGroupNameSpan(displayName.split(' ')[1]);
    return buildTaxonEditFormRow(groupRank, [lbl, groupParent], 'sub');
}
function buildGroupNameSpan(name) {
    const span = _el('getElem', ['span', { text: name }]);
    $(span).css({ 'padding-top': '.55em' });
    return span;
}
function appendPrntFormElems(elems) {
    const attr = { class: 'sml-sub-form flex-row pTaxon', id: 'sub-form' };
    const cntnr = _el('getElem', ['div', attr]);
    $(cntnr).append(elems);
    $('#Parent_row').after(cntnr);
}
/** ------------------ FINISH SELECT FORM BUILD ----------------------------- */
/**
 * Initializes the edit-parent form's comboboxes and selects the current parent.
 * Hides the species row. Adds styles and modifies event listeners.
 */
function finishSelectPrntFormBuild() {
    tForm.initSelectFormCombos();
    selectParentTaxon($('#txn-prnt').data('txn'));
    finishParentSelectFormUi();
}
function handleOnSubGroupSelection(val) {
    _form('onSubGroupSelection', [val])
    .then(hideGroupAndSpeciesCombo)
    .then(enableChangeParentSubmitBttn);
}
/** Note: Species combo needs to stay in DOM for the combo change methods. */
function hideGroupAndSpeciesCombo() {
    $('#Group_row, #Species_row').hide();
}
function enableChangeParentSubmitBttn() {
    _elems('toggleSubmitBttn', ['#sub-submit', true]);
}
export function selectParentTaxon(pId) {
    const pTaxon = taxonData.rcrds[pId];                            /*dbug-log*///console.log('selectParentTaxon[%s] = %O', pId, pTaxon);
    ifSubGroupSelect(pTaxon);
    if (pTaxon.isRoot) { return; }
    const pRank = pTaxon.rank.displayName;
    _cmbx('setSelVal', [pRank, pId]);
}
function ifSubGroupSelect(pTaxon) {
    if (!$('#Sub-Group_row').length) { return; }
    _cmbx('setSelVal', ['Sub-Group', pTaxon.group.subGroup.id, 'silent']);
}
function finishParentSelectFormUi() {
    alignGroupRankText();
    clearAndDisableTopFormParentFields();
    $('#Species_row').hide();
    updateSubmitBttns();
}
function alignGroupRankText() {
    if ($('#Sub-Group_row').length) { return; }
    const groupRank = $('#txn-prnt span')[0].innerText.split(' ')[1];
    $('#'+groupRank+'_row .field-row')[0].className += ' group-row';
}
function clearAndDisableTopFormParentFields() {
    $('#txn-prnt span').text('');
    $('#chng-prnt').attr({'disabled': true}).css({'opacity': '.6'});
}
function updateSubmitBttns() {
    $('#sub-submit').attr('disabled', false).css('opacity', '1');
    $('#sub-submit').off('click').click(selectNewTaxonParent);
    $('#sub-cancel').off('click').click(cancelPrntEdit);
    _elems('toggleSubmitBttn', ['#top-submit', false]);
    $('#sub-submit')[0].value = 'Select Taxon';
}
function selectNewTaxonParent() {
    const selected = _form('getSelectedTaxon');
    const prnt = selected ? selected : _state('getTaxonProp', ['groupTaxon']);/*dbug-log*///console.log("selectNewTaxonParent called. prnt = %O", prnt);
    if (ifInvalidParentRank(getRankVal(prnt.rank.displayName))) { return; }
    exitPrntEdit(prnt);
}
function cancelPrntEdit() {
    const prnt = taxonData.rcrds[$('#txn-prnt').data('txn')];
    exitPrntEdit(prnt);
}
function exitPrntEdit(prnt) {
    resetAfterEditParentClose(prnt);
}
function resetAfterEditParentClose(prnt) {
    clearRankAlerts('#Parent_alert', 'sub');
    $('#sub-form').remove();
    $('#chng-prnt').attr({'disabled': false}).css({'opacity': '1'});
    setTaxonPrntNameElem(prnt);
    _elems('toggleSubmitBttn', ['#top-submit', true]);
}
/** ------------------------ DATA VALIDATION --------------------------------- */
/**
 * Ensures that the parent taxon has a higher taxon-rank and that a species
 * taxon being edited has a genus parent selected.
 */
function ifInvalidParentRank(pRank) {
    const issues = handleParentRankIssues(pRank);
    if (!issues) { clearRankAlerts('#Parent_alert', 'sub'); }
    return issues;
}
function handleParentRankIssues(pRank) {
    const txnRank = $('#sel-Rank').val();                           /*dbug-log*///console.log("handleParentRankIssues. txnRank = %s. pRank = %s", txnRank, pRank);
    const issues = [
        { 'needsHigherRankPrnt': txnRank <= pRank },
        { 'needsGenusPrnt': txnRank == 8 && pRank != 7 }
    ];
    return !issues.every(handleIfValIssue);

    function handleIfValIssue(issues) {
        for (let tag in issues) {
            return issues[tag] ? shwTxnValAlert(tag, 'Parent', 'sub') : true;
        }
    }
}
/** ======================= ROW BUILDERS ==================================== */
/**
 * Each element is built, nested, and returned as a completed row.
 * rowDiv>(alertDiv, fieldDiv>inputElems)
 */
function buildTaxonEditFormRow(field, inputElems, fLvl) {
    const rowDiv = buildFormRow(field, fLvl);
    const alertDiv = _el('getElem', ['div', { id: field+'_alert'}]);
    const fieldCntnr = buildFieldCntnr(inputElems);
    $(rowDiv).append([alertDiv, fieldCntnr]);
    return rowDiv;
}
function buildFormRow(field, fLvl) {
    const attr = { class: fLvl + '-row', id: field + '_row'};
    return _el('getElem', ['div', attr]);
}
function buildFieldCntnr(fields) {
    const cntnr =  _el('getElem', ['div', { class: 'field-row flex-row'}]);
    $(cntnr).append(fields);
    return cntnr;
}
/** =============== FINISH MAIN FORM BUILD ================================== */
export function finishEditFormBuild(entity) {
    $('#top-submit').off('click').click(submitTaxonEdit);
    initTaxonEditRankCombo();
    $('.all-fields-cntnr').hide();
}
function submitTaxonEdit() {
    const vals = {
        displayName: $('#Taxon_row > div.field-row.flex-row > input[type="text"]').val(),
        rank:       $('#Taxon_row select').text(),
        parentTaxon: $('#txn-prnt').data('txn')
    };                                                              /*dbug-log*///console.log("taxon vals = %O", vals);
    formatAndSubmitData('taxon', 'top', vals);
}
function initTaxonEditRankCombo() {
    _cmbx('initCombobox', [{ name: 'Rank', onChange: validateTaxonRank }]);
    _cmbx('setSelVal', ['Rank', $('#sel-Rank').data('rank'), 'silent']);
}
/** ======================= DATA VALIDATION ================================== */
/**
 * Ensures that the new taxon-rank is higher than its children, and that a
 * species taxon being edited has a genus parent selected.
 */
function validateTaxonRank(txnRank) {
    const pRank = $('#txn-prnt').data('rank');                   /*dbug-log*///console.log("validateTaxonRank. taxon = %s. parent = %s", txnRank, pRank);
    const valIssues = {
        'isGenusPrnt': isGenusPrnt(),
        'needsHigherRank': rankIsLowerThanKidRanks(txnRank)
    };
    for (let alertTag in valIssues) {
        if (valIssues[alertTag]) { return shwTxnValAlert(alertTag, 'Taxon', 'top'); }
    }
    clearActiveAlert('clrNeedsHigherRank', txnRank);
}
/** Returns true if the taxon's original rank is Genus and it has children. */
function isGenusPrnt() {
    const orgTxnRank = $('#sel-Rank').data('rank');
    const txnId = $('#sel-Rank').data('txn');
    return orgTxnRank == 6 && getHighestChildRank(txnId) < 8;
}
/**
 * Returns true if the passed rank is lower or equal to the highest rank of
 * the taxon-being-edited's children.
 */
function rankIsLowerThanKidRanks(txnRank) {
    const highRank = getHighestChildRank($('#sel-Rank').data('txn'));
    return txnRank >= highRank;
}
function getHighestChildRank(taxonId) {
    let high = taxonData.ranks.Species.ord;
    taxonData.rcrds[taxonId].children.forEach(checkChildRank);
    return high;

    function checkChildRank(id) {
        const child = taxonData.rcrds[id]
        if (child.rank.ord < high) { high = child.rank.ord; }
    }
}
function clearActiveAlert(alertTag, txnRank) {
    if ($('.top-active-alert').length) {
        _val(alertTag, [null, null, null, txnRank]);
    }
}
function shwTxnValAlert(alertTag, field, fLvl) {
    _val('showFormValAlert', [field, alertTag, fLvl]);
    _elems('toggleSubmitBttn', ['#top-submit', false]);
    return false;
}
function clearRankAlerts(elemId, fLvl) {
    if (!$('.top-active-alert').length) { return; }
    _val('clearAlert', [$(elemId)[0], fLvl]);
}
