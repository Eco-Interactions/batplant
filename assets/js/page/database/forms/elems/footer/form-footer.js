/**
 * Returns a container with 'Create [Entity]' and 'Cancel' buttons bound to events
 * specific to their form-container with a left spacer that pushes the buttons to the bottom right of their form container.
 *
 * TOC
 *     SHOW ALL FIELDS CHECKBOX
 *     SUBMIT AND CANCEL BUTTONS
 */
import { _el, _u } from '~util';
import { _elems, _state, exitFormLevel, submitForm } from '~form';
/**
 * Returns row with a checkbox that will toggle optional form fields on the left
 * and the submit/cancel buttons on the right.
 */
export function getFormFooter(entity, fLvl, action) {
    const cntnr = getFooterRowContainer();
    $(cntnr).append(...buildFooterElems(entity, fLvl, action));
    return cntnr;
}
function getFooterRowContainer() {
    return _el('getElem', ['div', { class: 'flex-row bttn-cntnr' }]);
}
function buildFooterElems(entity, fLvl, action) {
    const toggleFields = _elems('ifMutlipleDisplaysGetToggle', [entity, fLvl]);
    const spacer = $('<div></div>').css("flex-grow", 2);
    const bttns = buildSubmitAndCancelBttns(fLvl, action, entity);
    return [toggleFields, spacer, bttns];
}
/* ------------------ SUBMIT AND CANCEL BUTTONS ----------------------------- */
/** Returns the buttons with the events bound. */
function buildSubmitAndCancelBttns(fLvl, action, entity) {
    const events = getBttnEvents(entity, fLvl);                     /*dbug-log*/console.log("buildSubmitAndCancelBttns events[%O]", events);
    return [getSubmitBttn(), getCancelBttn()];

    function getSubmitBttn() {
        const bttn = buildFormButton('submit', fLvl, getSubmitText());
        $(bttn).attr("disabled", true).css("opacity", ".6").click(events.submit);
        return bttn;
    }
    function getSubmitText() {
        const text = { create: "Create", edit: "Update" };;
        return text[action] + " " + _u('ucfirst', [entity]);
    }
    function getCancelBttn() {
        const bttn = buildFormButton('cancel', fLvl, 'Cancel');
        $(bttn).css("cursor", "pointer").click(events.cancel);
        return bttn;
    }
}
/** Submit and cancel default-events merged with any set for the entity-form. */
function getBttnEvents(entity, fLvl) {                              /*dbug-log*///console.log("getBttnEvents [%s][%s]", fLvl, entity);
    return {
        submit: getSubmitEvent(entity, fLvl),
        cancel: getCancelFunc(entity, fLvl)
    };
}
function getSubmitEvent(entity, fLvl) {
    return submitForm.bind(null, `#${fLvl}form`, fLvl, entity);
}
function getCancelFunc(entity, fLvl) {
    if (fLvl === 'top') { return _elems.bind(null, 'exitRootForm'); }
    let onExit = _state('getFormProp', [fLvl, 'onFormClose']);
    onExit = onExit || Function.prototype;
    return exitFormLevel.bind(null, fLvl, true, onExit);
}
/** Returns a (submit or cancel) button for the form fLvl. */
function buildFormButton(actn, lvl, val) {
    const attr = { id: lvl+'-'+actn, type: 'button', value: val}
    return _el('getElem', ['input', attr]);
}