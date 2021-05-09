/**
 * TODO: DOCUMENT
 *
 * Export
 *     rebuildFieldsOnFormConfgChanged
 */
import { _elems, _form } from '~form';

export function rebuildFieldsOnFormConfgChanged(fLvl, entity) {     /*dbug-log*///console.log('+--rebuildFieldsOnFormConfgChanged [%s][%s]', fLvl, entity);
    $(`#${entity}_fields`).remove();
    return _elems('getFormRows', [entity, fLvl])
        .then(rows => appendAndFinishRebuild(entity, fLvl, rows))
        .then(() => _elems('checkReqFieldsAndToggleSubmitBttn', [fLvl]));
}
function appendAndFinishRebuild(entity, fLvl, rows) {               /*dbug-log*///console.log('   --appendAndFinishRebuild rows[%O]', rows);
    $(`#${fLvl}_alert`).after(rows);
    _elems('finishFieldRebuild', [fLvl, entity])
    return _elems('fillComplexFormFields', [fLvl])
        .then(() => finishComplexForms(entity, fLvl));
}
function finishComplexForms(entity, fLvl) {
    const complex = ['Citation', 'Publication'];
    if (complex.indexOf(entity) === -1) { return; }
    return _form('finishSrcFieldLoad', [entity, fLvl]);
}
