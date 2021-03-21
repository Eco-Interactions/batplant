/**
 * Returns an object with (k) the form field and (v) value.
 *
 * Export
 *     getValidatedFormData
 */
import { _alert, _cmbx, _db, _u } from '~util';
import { _state, getSelectedVals } from '~form';

let md = {};

export function getValidatedFormData(confg) {
    md.confg = confg;
    md.data = buildServerDataObj();                                 /*dbug-log*///console.log('+--getValidatedFormData. [%s] [%O]', md.confg.name, md);
    return Promise.all(wrangleFormData())
        .then(alertIfFailures)
        .then(() => md.data);
}
function wrangleFormData() {
    return Object.values(md.confg.fields).map(getDataForServer);
}
/** [buildServerDataObj description] */
function buildServerDataObj() {                                     /*dbug-log*///console.log('   --buildServerDataObj');
    const serverData = {};
    setEntityObj('core');
    if (md.confg.core) { setEntityObj('detail'); }
    return serverData;

    function setEntityObj(dKey) {
        serverData[dKey] = { flat: {}, rel:{} };
    }
}
/**
 * [setServerData description]
 * @param {[type]} g [description]
 * @param {[type]} p [description]
 * @param {[type]} v [description]
 * @param {String} e [description]
 */
function setServerData(g, p, v, k = 'core') {
    if (!v && md.confg.action !== 'edit') { return; }             /*dbug-log*///console.log('           --setServerData [%s][%s][%s] = [%O]', k, g, p, v);
    md.data[k][g][p] = v;
}
/** [getDataForServer description] */
function getDataForServer(fConfg) {                                 /*dbug-log*///console.log('       --getDataForServer [%s][%O]', fConfg.name, fConfg);
    const fKey = fConfg.entity ? 'rel' : 'flat';
    if (!fConfg.active) { return; }  //Field not active. TODO: if field had data before edit began, set field "null" here
    if (fConfg.value === undefined) { return handleEmptyFieldData(fConfg); } //Field never set
    if (!getFieldValue(fConfg)) { handleEmptyFieldData(fConfg); }
    if (fConfg.prep) { return handleDataPreparation(fKey, fConfg);  }
    setServerData(fKey, fConfg.name, getFieldValue(fConfg));
}
function handleEmptyFieldData(fConfg) {
    if (!fConfg.required) { return; }
    trackFailure(fConfg.name, fConfg.value);
}
/**
 * [handleDataPreparation description]
 * @param  {[type]} fConfg
 * @return {[type]}         [description]
 */
function handleDataPreparation(fKey, fConfg) {                      /*dbug-log*///console.log('           --handleDataPreparation [%s][%O]', fKey, fConfg);
    Object.keys(fConfg.prep).forEach(handleDataPrep);

    function handleDataPrep(handler) {
        eval(handler)(fKey, fConfg, ...fConfg.prep[handler]);
    }
}
function getFieldValue(fConfg) {
    if (fConfg.type === 'multiSelect') { return returnMultiSelectValue(fConfg.value); }
    if (!_u('isObj', [fConfg.value])) { return fConfg.value; }
    return fConfg.value.value; //combos
}
function returnMultiSelectValue(values) {                           /*dbug-log*///console.log('               --returnMultiSelectValue [%O]', values);
    return Object.keys(values).length ? values : null ;
}
/* =========================== DATA WRANGLERS =============================== */
function renameField(g, fConfg, name, dKey = 'core') {              /*dbug-log*///console.log('               --renameField [%s]entity[%s] fConfg[%O]', name, dKey, g, fConfg);
    setServerData(g, name, getFieldValue(fConfg), dKey);
}
function setCoreType(g, fConfg) {                                   /*dbug-log*///console.log('               --setCoreType [%s] fConfg[%O]', g, fConfg);
    const prop = _u('ucfirst', [md.confg.core]) + 'Type';
    const val = _state('getRcrd', ['coreTypes', fConfg.value]);
    setServerData(g, prop, val);
}
function setParent(g, fConfg, entity) {                             /*dbug-log*///console.log('               --setParent [%s]entity[%s] fConfg[%O]', g, entity, fConfg);
    const prop = 'Parent' + entity;
    if (isNaN(fConfg.value)) { return trackFailure(prop, fConfg.value); }
    setServerData(g, prop, fConfg.value); //Value
}
/**
 * [setCoreAndDetail description]
 * @param {[type]} g           [description]
 * @param {[type]} fConfg      [description]
 * @param {[type]} emptyString There are no additional params needed.
 */
function setCoreAndDetail(g, fConfg, emptyString) {
    ['core', 'detail'].forEach(e => setServerData(g, fConfg.name, fConfg.value, e));
}
/* =========================== TRACK FAILUTES =============================== */
function trackFailure(preop, value) {
    if (!md.data.fails) { md.data.fails = {}; }
    md.data.fails[prop] = value;
}
function alertIfFailures() {
    if (!md.data.fails) { return; }
    _alert('alertIssue', ['dataPrepFail', JSON.stringify(data.fails) ]);
}