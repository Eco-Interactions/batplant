import * as _f from '../../../forms-main.js';
/**
 * Returns an obj with the entity's field defs and all required fields.
 * @return {obj} .fields   Obj - k: fieldName, v: fieldType.
 *               .required Ary of required fields
 */
export default function getFieldConfgs(entity, fLvl) {                                        
    const confg = getFormConfgData(entity, fLvl);                               //console.log('[%s] get[%s]FieldConfg = %O', fLvl, entity, confg);
    return {
        fields: getIncludedFields(confg),
        order: getFieldOrder(confg),
        required: getRequiredFields(confg)
    }
}   
function getFormConfgData(entity, fLvl) {
    return {
        entity: entity,
        form: _f.confg('getFormConfg', [entity]), 
        type: getEntityTypeFormConfg(entity, fLvl),
        showAll: _f.state('getFormProp', [fLvl, 'expanded'])
    };
}
function getEntityTypeFormConfg(entity, fLvl) {
    const type = _f.state('getFormProp', [fLvl, 'entityType'])
    return type ? _f.confg('getFormConfg', [entity]).types[type] : false;
}
function getIncludedFields(confg) {
    const allFields = getFieldTypes(confg);
    const included = {}
    getFormFieldNames(confg).forEach(field => included[field] = allFields[field]);    
    return included;
}
function getFieldTypes(confg) {
    const coreFields = _f.confg('getCoreFieldDefs', [confg.entity]);
    return Object.assign(coreFields, confg.form.add);
}
/**
 * Returns an array of fields to include in the form. If the form is a 
 * source-type, the type-entity form config is combined with the main-entity's.
 * Eg, Publication-type confgs are combined with publication's form confg.
 */
function getFormFieldNames(confg) {                                
    const dfault = getCoreEntityFields(confg);
    const typeFields = getEntityTypeFields(confg);
    return dfault.concat(typeFields);
}
function getCoreEntityFields(confg) {
    const fields = confg.form.required.concat(confg.form.suggested);
    return confg.showAll ? fields.concat(confg.form.optional) : fields;
}
function getEntityTypeFields(confg) {
    const fields = confg.type ? 
        confg.type.required.concat(confg.type.suggested) : [];
    return  confg.showAll ? fields.concat(confg.type.optional) : fields;
}
function getFieldOrder(cfg) {
    const order = cfg.showAll ? getExpandedOrder(cfg) : getDefaultOrder(cfg); 
    return order.map(field => field);
}
/** <type> eg: publication - book, jounrnal, thesis, record, and other 'types'. */
function getExpandedOrder(cfg) {
    return cfg.type ? cfg.form.order.opt.concat(cfg.type.order.opt) : 
        cfg.form.order.opt ? cfg.form.order.opt : cfg.form.order.sug;
}
function getDefaultOrder(cfg) {
    return cfg.type ? cfg.form.order.sug.concat(cfg.type.order.sug) : cfg.form.order.sug;
}
function getRequiredFields(cfg) {
    return cfg.type ? cfg.type.required.concat(cfg.form.required) : cfg.form.required;
}