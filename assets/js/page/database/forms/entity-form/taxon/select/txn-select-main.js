/**
 * Builds a form to select a taxon with a combobox for the Group and Sub-group,
 * when selecting the taxon group and/or sub-group is available, and one for each
 * rank present in the taxon group, (eg: Bat - Family, Genus, and Species), filled
 * with the taxa at that rank in the group. When one is selected, the remaining
 * boxes are repopulated with related taxa and the 'select' button is enabled.
 * A 'Select Unspecified' button allows selection of a (sub)group's root taxon.
 * @since Refactored 11/2020
 *
 * TOC
 *     INIT
 *     GROUPS
 *     RANKS
 *     SELECTED
 */
import { _cmbx } from '~util';
import { _elems, _form, _state, _val } from '~form';
import * as build from './build-taxon-select.js';
import * as rank from './rank/txn-rank-main.js';
import * as group from './group-fields.js';


export function initSelectFormCombos(editHandlers = null) {
    const events = getSelectComboEvents();
    if (editHandlers) { replaceEditEvents(events, editHandlers); }
    _elems('initFormCombos', [null, 'sub', events]);
}
function getSelectComboEvents() {
    return {
        'Class': { onChange: onRankSelection, create: create.bind(null, 'class') },
        'Family': { onChange: onRankSelection, create: create.bind(null, 'family') },
        'Genus': { onChange: onRankSelection, create: create.bind(null, 'genus') },
        'Order': { onChange: onRankSelection, create: create.bind(null, 'order') },
        'Group': { onChange: onGroupSelection },
        'Sub-Group': { onChange: onSubGroupSelection },
        'Species': { onChange: onRankSelection, create: create.bind(null, 'species') },
    };
}
function replaceEditEvents(events, newEvents) {
    Object.keys(newEvents).forEach(updateEvents);

    function updateEvents(field) {
        Object.keys(newEvents[field]).forEach(updateConfgProp);

        function updateConfgProp(prop) {
            events[field][prop] = newEvents[field][prop];
        }
    }
}
function create(rank, val) {
    return _form('createSubEntity', [rank, 'sub2', val]);
}
/* ======================= INIT =========================================== */
export function initRoleTaxonSelect(role, gId) {
    if (ifSubFormAlreadyInUse(role)) { return _val('openSubFormAlert', [role, 'sub']); }
    const groupId = gId ? gId : getGroupId(role);
    if (role === 'Subject') { return build.initTaxonSelectForm('Subject', groupId); }
    build.initTaxonSelectForm('Object', groupId)
    .then(() => _cmbx('removeOpt', ['Group', 1]))  //removes Bat group option
    .then(() => onGroupSelection(groupId))  // Builds the group's rank combos
    .then(() => build.selectPrevTaxonAndResetRoleField('Object'));
}
function getGroupId(role) {
    const prevSelectedId = $('#sel-'+role).data('selTaxon');
    if (!prevSelectedId) { return role === 'Subject' ? 1 : 2; } //defaults: Bats (1), Plants (2)
    return _state('getRcrd', ['taxon', prevSelectedId]).group.id;
}
/* ----------------- IF OPEN SUB-FORM ISSUE --------------------------------- */
function ifSubFormAlreadyInUse(role) {
    return _form('ifFormAlreadyOpenAtLevel', ['sub']) ||
        ifOppositeRoleFormLoading(role);
}
function ifOppositeRoleFormLoading(role) {
    const oppRole = role === 'Subject' ? 'Object' : 'Subject';
    return $('#sel-'+oppRole).data('loading');
}
/* ======================= GROUPS =========================================== */
export function onGroupSelection() {
    return group.onGroupSelection(...arguments);
}
export function onSubGroupSelection() {
    return group.onSubGroupSelection(...arguments);
}
/* ======================== RANKS =========================================== */
export function onRankSelection(val) {
    if (val === 'new') { return; } // New taxon being created.
    rank.onRankSelection(val, this.$input[0]);
}
/* ======================== SELECTED ======================================== */
/** Finds the most specific rank with a selection and returns that taxon record. */
export function getSelectedTaxon(aboveRank) {
    const selElems = $('#sub-form .selectized').toArray();
    if (ifEditingTaxon()) { selElems.reverse(); } //Taxon-parent edit-form.
    const selected = selElems.find(isSelectedTaxon.bind(null, aboveRank));/*dbug-log*///console.log("getSelectedTaxon above [%s]. selElems = %O selected = %O", aboveRank, selElems, _state('getRcrd', ['taxon', $(selected).val()]));
    return !selected ? false : _state('getRcrd', ['taxon', $(selected).val()]);

    function ifEditingTaxon() {
        const action = _state('getFormProp', ['top', 'action']);
        const entity = _state('getFormProp', ['top', 'entity']);
        return action == 'edit' && entity == 'taxon';
    }
}
/** Note: On combo reset, the most specific taxon above the resetRank is selected. */
function isSelectedTaxon(resetRank, elem) {
    if (!ifIsRankComboElem(elem)) { return false; }
    if (resetRank && isRankChildOfResetRank(resetRank, elem)) { return false; }
    return $(elem).val();
}
function isRankChildOfResetRank(resetRank, elem) {
    const allRanks = Object.keys(_state('getTaxonProp', ['ranks']));
    const rank = elem.id.split('sel-')[1];                          /*dbug-log*///console.log('is [%s] sub-rank to [%s]', rank, resetRank, allRanks.indexOf(rank) < allRanks.indexOf(resetRank));
    return allRanks.indexOf(rank) > allRanks.indexOf(resetRank);
}
function ifIsRankComboElem(elem) {
    return elem.id.includes('sel') && !elem.id.includes('Group');
 }