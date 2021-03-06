/**
 * Builds a single form-row.
 */
import { _el, _u } from '~util';
/**
 * Each element is built, nested, and returned as a completed row.
 * rowDiv>(alertDiv, fieldDiv>(label, input, [pin]))
 */
export default function buildFormRow(field, input, fLvl, rowClss, info) {/*dbug-log*///console.log('buildFormRow[%s][%s] class?[%s] info?[%s] input = %O', field, fLvl, rowClss, info, input);
    const rowDiv = buildRowContainer(field, input, fLvl, rowClss);
    const alertDiv = _el('getElem', ['div', { id: field+'_alert'}]);
    const fieldCntnr = buildField(input, field, fLvl, info);
    $(rowDiv).append([alertDiv, fieldCntnr]);
    return rowDiv;
}
function buildRowContainer(field, input, fLvl, rowClss) {
    const attr = { class: getRowClasses(), id: field + '_row'}
    return _el('getElem', ['div', attr]);
    /** Returns the style classes for the row. */
    function getRowClasses() {
        const rowClass = input.className.includes('xlrg-field') ?
            'full-row' : (fLvl + '-row') + (rowClss ? (' '+rowClss) : '');
        return rowClass;
    }
}
function buildField(input, field, fLvl, info) {
    const cntnr = buildFieldContainer(fLvl, info);
    const label = buildFieldLabel(input, field);
    const pin = fLvl === 'top' ? getPinElem(field) : null;
    $(cntnr).append([label, input, pin]);
    return cntnr;
}
/** Note: The formLvl class is used for the form-specific tutorials.
 */
function buildFieldContainer(fLvl, info) {
    const attr = { class: 'field-row flex-row', title: getInfoTxt(info)};
    const cntnr = _el('getElem', ['div', attr]);
    if (info) { addTutorialDataAttr(cntnr, fLvl, info); }
    return cntnr;
}
function addTutorialDataAttr(cntnr, fLvl, info) {
    $(cntnr).addClass(fLvl+'-intro')
        .attr({
            'data-intro': getInfoTxt(info, 'intro'),
            'data-intro-group': fLvl+'-intro'
        });
}
function getInfoTxt(info, key = 'tooltip') {
    return typeof info === 'string' ? info : info[key];
}
function buildFieldLabel(input, field) {
    const attr = { id: field+'-lbl', class: getLabelClass(), text: getFieldName()};
    return _el('getElem', ['label', attr]);

    function getLabelClass() {
        return $(input).data('fLvl') ? 'required' : '';
    }
    function getFieldName() {
        const fieldName = field.includes('-') ? field : field.replace(/([A-Z])/g, ' $1'); //Adds space between pascal-cased words
        return _u('ucfirst', [fieldName]).trim();
    }
}
function getPinElem(field) {
    const pin = buildPinElem(field);
    handledRelatedFieldPins(pin, field);
    return pin;
}
function buildPinElem(field) {
    const attr = {type: 'checkbox', id: field+'_pin', class: 'top-pin'};
    const pin = _el('getElem', ['input', attr]);
    _u('addEnterKeypressClick', [pin]);
    return pin;
}
function handledRelatedFieldPins(pin, field) {
    const relFields = ['CitationTitle', 'Country-Region', 'Location', 'Publication'];
    if (relFields.indexOf(field) !== -1) { $(pin).click(checkConnectedFieldPin); }
}
/**
 * When a dependent field is pinned, the connected field will also be pinned.
 * If the connected field is unpinned, the dependant field is as well.
 */
function checkConnectedFieldPin() {
    const field = this.id.split("_pin")[0];
    const params = {
        'CitationTitle': { checked: true, relField: 'Publication' },
        'Country-Region': { checked: false, relField: 'Location' },
        'Location': { checked: true, relField: 'Country-Region' },
        'Publication': { checked: false, relField: 'CitationTitle' },
    }
    checkFieldPins(this, params[field].checked, params[field].relField);
}
function checkFieldPins(curPin, checkState, relField) {
    if (curPin.checked === checkState) {
        if ($('#'+relField+'_pin')[0].checked === checkState) { return; }
        $('#'+relField+'_pin')[0].checked = checkState;
    }
}