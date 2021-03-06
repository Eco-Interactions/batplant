/**
 * Checks all required citation fields, generates the citation, and sets the
 * disabled textarea field. Default text displays Until required fields are filled.
 *
 * Export
 *     buildCitTextAndUpdateField
 *
 * TOC
 *     GET CITATION TEXT
 *     GET ALL DATA FOR CITATION
 *     UPDATE FIELD
 */
import { _cmbx, _u } from '~util';
import { _state, _elems, getNextFormLevel, getValidatedFormData } from '~form';

export function buildCitTextAndUpdateField(fLvl) {
    const $elem = $('#CitationText_row textarea');
    if (!$elem.val()) { initializeCitField($elem); }

    return getCitationFieldText($elem, fLvl)
        .then(citText => updateCitField(citText, $elem))
}
function initializeCitField($elem) {
    $elem.prop('disabled', true).unbind('change').css({height: '6.6em'});
}
/* ------------------------ GET CITATION TEXT ------------------------------- */
/** Returns the citation field text or false if there are no updates. */
function getCitationFieldText($elem, fLvl) {
    const dfault = 'The citation will display here once all required fields '+
        'are filled.';
    return Promise.resolve(getCitationText());

    function getCitationText() {
        return _elems('ifNoOpenSubFormAndAllRequiredFieldsFilled', [fLvl]) ?
            buildCitationText(fLvl) :
           ($elem.val() === dfault ? false : dfault);
    }
}
function ifNoChildFormOpen(fLvl) {
   return $('#'+getNextFormLevel('child', fLvl)+'-form').length == 0;
}
function buildCitationText(fLvl) {
    return getValidatedFormData('citation', fLvl, null)
        .then(fData => _u('generateCitationText', [getDataForCitation(fData, fLvl), true]));
}
/* -------------------- GET ALL DATA FOR CITATION --------------------------- */
function getDataForCitation(fData, fLvl) {                          /*dbug-log*///console.log('getDataForCitation [%s] fData = %O', fLvl, fData)
    const data = {
        pubSrc: _state('getFormProp', [fLvl, 'rcrds']).src,
        citSrc: { authors: fData.authors, year: fData.year },
        cit: buildCitData(fData),
        showWarnings: true
    };
    return Object.assign(data, addEntityRecords());
}
function buildCitData(fData) {
    return {
        citationType: { displayName: _cmbx('getSelTxt', ['CitationType']) },
        title: fData.title ? fData.title : fData.chapterTitle,
        publicationPages: fData.pages,
        publicationIssue: fData.issue,
        publicationVolume: fData.volume ? fData.volume : fData.edition,
    };
}
function addEntityRecords() {
    const entities = ['author', 'citation', 'publisher', 'source'];
    return { rcrds: _state('getEntityRcrds', [entities])};
}
/* --------------------------- UPDATE FIELD --------------------------------- */
function updateCitField(citText, $elem) {
    if (!citText) { return; }
    $elem.val(citText).change();
}