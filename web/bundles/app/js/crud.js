/**
 * When logged in as an 'admin' or 'super': 
 * >> On the database search page, multiple admin-ui elements are added that open 
 * a popup interface allowing the creating, updating and, soon, deleting of data.   
 * >> All Content Blocks will have an edit icon attached to the top left of their 
 * container. When clicked, a wysiwyg interface will encapsulate that block and 
 * allow editing and saving of the content within using the trumbowyg library.
 */
$(document).ready(function(){  
    var userRole, envUrl, cParams = {};
    var eif = ECO_INT_FMWK;
    var _util = eif.util;

    document.addEventListener('DOMContentLoaded', onDOMContentLoaded); 
  
    function onDOMContentLoaded() { 
        userRole = $('body').data("user-role");                                 //console.log("crud.js role = ", userRole);                               console.log("----userRole =", userRole)
        envUrl = $('body').data("ajax-target-url");
        authDependentInit(); 
    }
    function authDependentInit() {   
        if (userRole === "admin" || userRole === "super") {                     //console.log("admin CRUD ACTIVATE!! ");
            if ($('body').data("this-url") === "/search") {
                buildSearchPgCrudUi();
            } 
            initWysiwyg();
        }
    }
/*--------------------- SEARCH PAGE CRUD -------------------------------------*/
    /*---------- CRUD Window Funcs -------------------------------------------*/
    /** Adds a "New" button under the top grid focus options. */
    function buildSearchPgCrudUi() {
        var bttn = _util.buildElem('button', { 
                text: "New", name: 'createbttn', class: "adminbttn" });
        $(bttn).click(initInteractionCrud);
        $("#opts-col1").append(bttn);
    }
    /**
     * Builds the crud window popup @showEntityCrudPopup and loads the form @initCrudView.
     */
    function initInteractionCrud() {                                            console.log("***initInteractionCrud***")
        showEntityCrudPopup();
        initCrudView();
    }
    /** Builds and shows the crud popup from @getCrudHtml */
    function showEntityCrudPopup() {
        $("#b-overlay-popup").addClass("crud-popup");
        $("#b-overlay").addClass("crud-ovrly");
        $("#b-overlay-popup").append(getCrudWindowElems("New Interaction"));
        setPopUpPos();
        $('#b-overlay-popup, #b-overlay').show();
    }
    /** Sets popup top using parent position. */
    function setPopUpPos() {
        var parentPos = $('#b-overlay').offset();  
        $('#b-overlay-popup').offset({ top: (parentPos.top + 88)});          
    }
    function hideSearchCrudPopup() {
        $('#b-overlay-popup, #b-overlay').hide();
    }
    /**
     * Builds the main crud window elements.
     * section>(header, div#crud-main, footer)
     */
    function getCrudWindowElems(title) {
        var cntnr = _util.buildElem("section");
        $(cntnr).append(getHeaderHtml(title));
        $(cntnr).append(_util.buildElem("div", { "id": "crud-main" }));
        $(cntnr).append(_util.buildElem("footer"));
        return cntnr;        
    }
    function getHeaderHtml(title) {
        var hdrSect = _util.buildElem("header", { "id": "crud-hdr" });
        $(hdrSect).append(_util.buildElem("h1", { "text": title }));
        $(hdrSect).append(_util.buildElem("p"));
        return hdrSect;
    }
    /*--------------- CRUD Params Object -------------------------------------*/
    /**
     * Sets the global cParams obj with the params necessary throughout the 
     * crud form interface. 
     * -- Property descriptions:
     * > action - eg, Create, Edit.
     * > subForms - Container for subform-specific params 
     * > formLevels - An array of the form level names/tags/prefixes/etc.
     * > selectizeApi - Contains the selectize libray's api organized by 
     *   form-level and the select elem parent for each selectized combobox elem. 
     *   organized by form level and the parent select's id. 
     * > records - An object of all records, with id keys, for each of the 
     *   root entities- Interaction, Location, Source and Taxa.
     */
    function initCrudParams(action) {                                           //console.log("####cPs = %O", cParams)
        cParams = {
            action: action,
            subForms: {},
            formLevels: ["top", "sub", "sub2"],
            selectizeApi: { "top": {}, "sub": {}, "sub2": {} },
            records: {
                "source": JSON.parse(localStorage.getItem('srcRcrds')),
                "location": JSON.parse(localStorage.getItem('locRcrds')),
            }
        };
        initFormLevelParamsObj("interaction", "top", null, null);
    }
    /**
     * Adds the properties and confg that will be used throughout the code for 
     * generating, validating, and submitting sub-form. 
     */
    function initFormLevelParamsObj(entity, level, pSel, formConfg) {           //console.log("initLvlParams. cP = %O, arguments = %O", cParams, arguments)
        cParams.subForms[entity] = level;
        cParams.subForms[level] = {
            entity: entity,
            pSelElemId: pSel,
            selElems: [], 
            reqElems: [],
            confg: formConfg,
        };      
    }
/*------------------- Form Functions -------------------------------------------------------------*/
    /**
     * Fills the global cParams obj with the basic crud params @initCrudParams. 
     * Init the crud form and append into the crud window @initCrudForm. 
     */
    function initCrudView() {
        initCrudParams("create");
        initCrudForm();
    }       
    /**
     * Inits the interaction form with only two elements- a publication dropdown 
     * and a disabled citation title dropdown that will become active upon publication 
     * selection. Both dropdowns will display create forms when the user enters a title 
     * not currently in the database. Upon citation selection the form will continue 
     * to generate fields and sub-forms as the user's input indicates neccessary. 
     */
    function initCrudForm() {
        var formCntnr = buildCrudFormCntnr();
        var srcFields = buildSrcFields();
        $(formCntnr).append(srcFields);
        $('#crud-main').append(formCntnr);
        initTopFormCombobox("publication");
        initTopFormCombobox("citation");
    }      
    /** Builds the form elem container. */
    function buildCrudFormCntnr() {
        var form = document.createElement("form");
        $(form).attr({"action": "", "method": "POST", "name": "crud"});
        form.className = "crud-form flex-row";
        return form;
    }
    /** Inits the main source form fields: publication and citation. */
    function buildSrcFields() {
        var pubSel = buildPubFieldRow();
        var citSel = buildCitFieldRow();
        return [pubSel, citSel];
    }
    /*-------------- Top Form Helpers ----------------------------------------------------------*/
    /*-------------- Publication  --------------------------------------------*/
    /**
     * Returns a form row with a publication select dropdown populated with all 
     * current publication titles.
     */
    function buildPubFieldRow() {
        var selElem;
        var pubObj = JSON.parse(localStorage.getItem('publications'));
        var opts = Object.keys(pubObj).sort().map(function(name) {
            return { value: pubObj[name].toString(), text: name };
        });  
        selElem = _util.buildSelectElem(opts, {id: "Publication-sel", class: "lrg-field"});
        return buildFormRow("Publication", selElem, "top", true);
    }
    /** When a publication is selected fill citation dropdown @initCitField.  */
    function onPubSelection(val) { 
        if (val === "" || isNaN(parseInt(val)) ) { return; }                                
        initCitField(val);
    }
    /**
     * When a user enters a new publication into the combobox, a create-publication
     * form is built and appended to the crud form. An option object is 
     * returned and thus selected in the combobox
     */
    function initPubForm(val) {                                                 //console.log("Adding new pub! val = %s", val);
        $('form[name="crud"]').append(initSubForm(
            "publication", "sub", "flex-row", {"Title": val}, "#Publication-sel"));
        initSubFormComboboxes("publication");
        return { "value": "", "text": "Creating Publication..." };
    }
    /*-------------- Citation  -----------------------------------------------*/
    /** Returns a form row with an empty and disabled citation select dropdown. */
    function buildCitFieldRow() {
        var selElem = _util.buildSelectElem([], {id: "Citation-sel", class: "lrg-field"});
        $(selElem).attr("disabled", true);
        return buildFormRow("Citation Title", selElem, "top", true);
    }
    /**
     * Fills the citation field combobox with all citations for the selected publication.
     * Clears any previous options and enables the dropdown.
     */
    function initCitField(pubId) {                                              console.log("initCitSelect for publication = ", pubId);
        var pubRcrd = cParams.records.source[pubId];  
        var citOpts = getPubCitationOpts(pubRcrd);  
        var sel = $('#Citation-sel')[0].selectize;
        updateComboboxOptions(sel, citOpts);
        sel.enable();
    }
    /** Returns an array of option objects with citations for this publication.  */
    function getPubCitationOpts(pubRcrd) {
        if (!pubRcrd) { return []; }
        return pubRcrd.childSources.map(function(citId) {
            return { value: citId, text: cParams.records.source[citId].displayName };
        });
    }
    /** When a Citation is selected, both 'top' location fields are initialized. */    
    function onCitSelection(val) {  
        if (val === "" || isNaN(parseInt(val))) { return; }                     //console.log("cit selection = ", parseInt(val));                          
        buildCountryFieldRow();
        buildLocationFieldRow();        
    }
    function initCitForm(val) {                                                 //console.log("Adding new cit! val = %s", val);
        $('form[name="crud"]').append(initSubForm(
            "citation", "sub", "flex-row", {"Title": val}, "#Citation-sel"));
         initSubFormComboboxes("citation");
        return { "value": "", "text": "Creating Citation..." };
    }
    /*-------------- Country -------------------------------------------------*/
    /**
     * Returns a form row with a country select dropdown populated with all 
     * available countries.
     */
    function buildCountryFieldRow() {                                           //console.log("buildingCountryFieldRow. ");
        var cntryOpts = buildOptsObj(JSON.parse(localStorage.getItem('countries')));  
        var selElem = _util.buildSelectElem(cntryOpts, {id: "Country-sel", class: "lrg-field"});
        $('form[name="crud"]').append(buildFormRow("Country", selElem, "top", false));
        initTopFormCombobox("country");
    }
    function onCntrySelection(val) {                                            //console.log("country selected 'val' = ", val);
        if (val === "" || isNaN(parseInt(val))) { return; }          
        var cntryRcrd = cParams.records.location[val];
        fillLocationSelect(cntryRcrd);
    }
    /*-------------- Location ------------------------------------------------*/
    /**
     * Returns a form row with a country select dropdown populated with all 
     * available countries.
     */
    function buildLocationFieldRow() {                                          //console.log("buildingLocationFieldRow. ");
        var locOpts = getLocationOpts();                                        //console.log("locOpts = %O", locOpts);
        var selElem = _util.buildSelectElem(
            locOpts, {id: "Location-sel", class: "lrg-field"});
        $('form[name="crud"]').append(buildFormRow("Location", selElem, "top", true));
        initTopFormCombobox("location");
    }
    /** Returns an array of option objects with all unique locations.  */
    function getLocationOpts() {
        var opts = [];
        for (var id in cParams.records.location) {
            opts.push({ 
                value: id, text: cParams.records.location[id].displayName });
        }
        return opts;
    }
    /**
     * When a country is selected, the location combobox is repopulated with the 
     * country's child-locations.  
     */ 
    function fillLocationSelect(cntry) {                                        //console.log("fillLocationSelect for cntry = %O", cntry);
        var opts = getChildLocOpts(cntry);    
        var selApi = cParams.selectizeApi.top['#Location-sel'];
        updateComboboxOptions(selApi, opts);
    }
    /** Returns an array of options for the child-locations of the passed country. */
    function getChildLocOpts(cntry) {
        return cntry.childLocs.map(function(id) {  
            return { value: id, text: cParams.records.location[id].displayName };
        });
    }
    function onLocSelection(e) {  console.log("location selected 'e'= %O", e);
        // body...
    }
    function initLocForm(val) {        console.log("Adding new loc! val = %s", val);
        $('form[name="crud"]').append(initSubForm(
            "location", "sub", "flex-row", {"Display Name": val}, "#Location-sel"));
         initSubFormComboboxes("location");
        return { "value": "", "text": "Creating Location..." };
    }
    /*-------------- Sub Form Helpers ----------------------------------------------------------*/
    /*-------------- Publisher -----------------------------------------------*/
    /**
     * When a user enters a new publisher into the combobox, a create-publisher
     * form is built, appended to the publisher field row and an option object is 
     * returned to be selected in the combobox. Unless there is already a sub2Form,
     * where a message will be shown telling the user to complete the open sub2 form
     * and the form init canceled.
     * Note: The publisher form inits with the submit button enabled, as display 
     *     name, aka val, is it's only required field.
     */
    function initPublisherForm (val) {                                          //console.log("Adding new publisher! val = %s", val);
        if ($('#sub2-form').length !== 0) { return openSub2FormError('Publisher', "#Publisher-sel"); }
        $('#Publisher_row').append(initSubForm(
            "publisher", "sub2", "sub2-right", {"Display Name": val}, "#Publisher-sel"));
        enableSubmitBttn("#sub2_submit");
        disableSubmitBttn("#sub_submit");
        return { "value": "", "text": "Creating Publisher..." };
    }

    /*-------------- Author --------------------------------------------------*/
    /**
     * When an author is selected, a new author combobox is initialized underneath
     * 'this' author combobox.
     */
    function onAuthSelection(val) {                                             //console.log("Add existing author = %s", val);
        if (val === "" || parseInt(val) === NaN) { return; }
        var cnt = $("#Authors_sel-cntnr").data("cnt") + 1;                          
        var parentFormEntity = cParams.subForms.sub.entity;
        var selConfg = { name: "Author", id: "#Authors-sel"+cnt, 
                         change: onAuthSelection, add: initAuthForm };

        $("#Authors_sel-cntnr").append(
            buildSelectElem( parentFormEntity, "Authors", cnt ));   
        $("#Authors_sel-cntnr").data("cnt", cnt);
        initSelectCombobox(selConfg, "sub");
    }
    /**
     * When a user enters a new author into the combobox, a create-author form is 
     * built, appended to the author field row, and an option object is returned 
     * to be selected in the combobox. Unless there is already a sub2Form, where 
     * a message will be shown telling the user to complete the open sub2 form
     * and the form init canceled.
     */
    function initAuthForm (val) {                                               //console.log("Adding new auth! val = %s", val);
        var authCnt = $("#Authors_sel-cntnr").data("cnt");
        var parentSelId = "#Authors-sel"+authCnt;
        if ($('#sub2-form').length !== 0) { return openSub2FormError('Authors', parentSelId); }
        $('#Authors_row').append(initSubForm(
            "author", "sub2", "sub2-left", {"Display Name": val}, parentSelId));
        disableSubmitBttn("#sub_submit");
        return { "value": "", "text": "Creating Author..." };
    }

    /*------------------- Shared Methods ---------------------------------------------------*/
    /*------------------- Combobox (selectize) Methods -----------------------*/
    /** Clears previous options, adds the new opts, and brings the select into focus. */
    function updateComboboxOptions(selApi, opts) {
        selApi.clearOptions();
        selApi.addOption(opts);
        selApi.focus()
    }
    /**
     * Inits the passed entity's combobox in the 'top' interaction form @initSelectCombobox. 
     */
    function initTopFormCombobox(entity) {
        var selMap = { 
            'publication': { 
                name: 'Publication', id: '#Publication-sel', change: onPubSelection, add: initPubForm },
            'citation': { 
                name: 'Citation', id: '#Citation-sel', change: onCitSelection, add: initCitForm },
            'country': { 
                name: 'Country', id: '#Country-sel', change: onCntrySelection, add: false },
            'location': { 
                name: 'Location', id: '#Location-sel', change: onLocSelection, add: initLocForm },
        };
        initSelectCombobox(selMap[entity], "top"); 
    }
    /**
     * Inits the combobox, using 'selectize', according to the passed config. 
     * Stores each element's selectize api in the global cParams.selectizeApi
     * by form-level and the selectized elem's id.
     *
     * Note: The 'selectize' library turns select dropdowns into input comboboxes
     * that allow users to search by typing and, when configured, add new options 
     * not in the list by triggering a sub-form for that entity.
     */
    function initSelectCombobox(confg, formLevel) {                             //console.log("initSelectCombobox. CONFG = %O. formLevel = ", confg, formLevel)
        var options = {
            create: confg.add,
            onChange: confg.change,
            placeholder: 'Select ' + confg.name
        };
        if (confg.options) { addAdditionalOptions(); }
        $(confg.id).selectize(options);  
        cParams.selectizeApi[formLevel][confg.id] = $(confg.id)[0].selectize;
        /** All non-standard options are added to this 'options' prop. */ 
        function addAdditionalOptions() {
            for (var opt in confg.options) {
                options[opt] = confg.options[opt];
            }
        }
    } /* End initSelectCombobox */
    /**
     * Inits 'selectize' for each select elem in the subForm's 'selElems' array
     * according to the 'selMap' config. Empties array after intializing.
     */
    function initSubFormComboboxes(entity) {
        var confg;
        var formLvl = cParams.subForms[entity];
        var selMap = { 
            "Publication_Type": { name: "Publication Type", change: false, add: false },
            "Authors": { name: "Authors", id:"#Authors-sel1", change: onAuthSelection, add: initAuthForm },
            "Publisher": { name: "Publisher", change: Function.prototype, add: initPublisherForm },
            "Tags":  { name: "Tag", change: false, add: false, 
                "options": { "delimiter": ",", "maxItems": null, "persist": false }},
            "Citation_Type": { name: "Citation Type", change: false, add: false },
            "Habitat_Type":  { name: "Habitat Type", change: false, add: false },
            "Location_Type":  { name: "Location Type", change: false, add: false },
        };
        cParams.subForms[formLvl].selElems.forEach(function(field) {            //console.log("Initializing --%s-- select", field);
            confg = selMap[field];
            confg.id = confg.id || '#'+field+'-sel';
            initSelectCombobox(confg, "sub");
        });
        cParams.subForms[formLvl].selElems = [];
    } 
    function disableFormParentSelectElem(selElemId, formLevel) {
        disableCombobox(selElemId, getNextFormLevel("parent", formLevel));
    }
    function disableCombobox(selId, formLvl) {                                  //console.log("selId = %s, lvl = %s", selId, formLvl)
        var selectized = cParams.selectizeApi[formLvl][selId];
        selectized.disable();
    }      
    /** Reset the passed selectized element */ 
    function clearCombobox(elem) {
        elem.clear();
        elem.updatePlaceholder();
    }    
    /*------------------- Form Builders --------------------------------------*/    
    /**
     * Builds and returns the subForm according to the passed params. 
     * (container)DIV>[(header)P, (fields)DIV, (buttons)DIV]
     */
    function initSubForm(formEntity, formLevel, formClasses, fieldVals, selElemId) {
        var subFormContainer = _util.buildElem('div', {
            id: formLevel+'-form', class: formClasses + ' flex-wrap'}); 
        var hdr = _util.buildElem(
            "p", { "text": "New "+_util.ucfirst(formEntity), "class": "sub-form-hdr" });
        var subForm = buildSubForm(formEntity, fieldVals, formLevel, selElemId);
        subForm.push(buildFormBttns(_util.ucfirst(formEntity), formLevel, selElemId));
        $(subFormContainer).append([hdr].concat(subForm));
        cParams.subForms[formLevel].pSelElemId = selElemId;
        disableFormParentSelectElem(selElemId, formLevel);
        return subFormContainer;
    }
    /** 
     * Builds all fields for sub-form and returns the completed row elems.
     * Also inits the crud params for the sub-form in the global cParams obj.
     */
    function buildSubForm(entity, fieldVals, level, pSel) {
        var formConfg = getSubFormConfg(entity);                                //console.log("typeFormConfg = %O", typeFormConfg)
        initFormLevelParamsObj(entity, level, pSel, formConfg);
        return getFormFieldRows(entity, formConfg, fieldVals, level);
    }
    /**
     * Returns a form-config object for the passed entity. 
     * -- Property descriptions:  
     * > add - Additonal fields for a detail-entity. E.g. Citation is a detail-entity
     *   of Source with a unique combination of fields from Source and itself.
     * > exclude - Fields to exclude in a detail-entity form. E.g. Citation doesn't 
     *   use Source's 'displayName' field as it's 'title' is it's display name. 
     * > required - Required fields for the entity.
     * > order - Order of the fields in the form. This is matched to the field elems' 
     *   id, which has no spaces.
     * > relFields - Fields that are relationships with other entities. This is 
     *   matched to the entity's property name, which is camel cased.
     */
    function getSubFormConfg(entity) {
        var fieldMap = { 
            "author": { 
                "add": { "First Name": "text", "Middle Name": "text", "Last Name": "text"}, 
                "exclude": ["Description", "Year", "Doi", "Authors"],
                "required": ["Last Name"], 
                "order": [ "DisplayName", "FirstName", "MiddleName", "LastName", 
                    "LinkUrl", "LinkText"],
                "relFields": []
            },
            "citation": {
                "add": { "Title": "text", "Volume": "text", 
                    "Issue": "text", "Pages": "text", "Tags": "tags", 
                    "Citation Text": "fullTextArea", "Citation Type": "select"},
                "exclude": ["Display Name", "Description"], 
                "required": ["Title", "Citation Text", "Citation Type"],
                "order": ["CitationText", "Title", "CitationType",    
                    "Year", "Volume", "Issue", "Pages", "Doi", "LinkUrl", "LinkText", 
                    "Tags", "Authors" ],
                "relFields": ["citationType", "authors", "tags", "publication"]
            },
            "location": {
                "add": {},  
                "exclude": [],
                "required": ["Display Name", "Location Type"],
                "order": ["DisplayName", "Description", "LocationType", "HabitatType", 
                    "Elevation", "ElevationMax", "Latitude", "Longitude" ],
                "relFields": ["locationType", "habitatType"]
            },
            "publication": {
                "add": { "Title" : "text", "Publication Type": "select", "Publisher": "select" },  
                "exclude": ["Display Name"],
                "required": ["Publication Type", "Title"],
                "order": ["Title", "Description", "PublicationType", "Year", "Doi",  
                    "LinkUrl", "LinkText", "Publisher", "Authors" ],
                "relFields": ["publicationType", "authors", "publisher"]
            },
            "publisher": { 
                "add": [], 
                "exclude": ["Year", "Doi", "Authors"],
                "required": ["Display Name"],
                "order": ["DisplayName", "Description", "LinkUrl", "LinkText"] },
                "relFields": []
        };
        return fieldMap[entity];
    }
    /**
     * Returns an object of fields and field types for the passed detail-entity's
     * parent entity.
     */
    function getParentEntityFields(entity) {
        var topEntity = {
            "author": "source",         "citation": "source",
            "publication": "source",    "publisher": "source",
            "location": "location"            
        };
        var fields = {
            "location": { "Display Name": "text", "Description": "textArea", 
                "Elevation": "text", "Elevation Max": "text", "Longitude": "text", 
                "Latitude": "text", "Habitat Type": "select", "Location Type": "select"
            },
            "source": { "Display Name": "text", "Description": "textArea", 
                "Year": "text", "Doi": "text", "Link Text": "text", "Link Url": "text", 
                "Authors": "multiSelect" 
            }
        };
        return fields[topEntity[entity]];
    }
    /**
     * Builds all rows for the sub-form according to the passed formConfig obj. 
     * Returns a container div with the rows ready to be appended to the form window.
     */
    function getFormFieldRows(entity, formCnfg, fieldVals, formLevel) {         //console.log("  Building Form rows. arguemnts = %O", arguments);
        var buildFieldType = { "text": buildTextInput, "tags": buildSelectElem, 
            "select": buildSelectElem, "multiSelect": buildMultiSelectElem,  
            "textArea": buildTextArea, "fullTextArea": buildLongTextArea };
        var defaultRows = buildDefaultRows();
        var additionalRows = buildAdditionalRows();
        return orderRows(defaultRows.concat(additionalRows), formCnfg.order);
        /** Adds the form-entity's default fields, unless they are included in exclude. */
        function buildDefaultRows() {                                           //console.log("    Building default rows");
            var dfltFields = getParentEntityFields(entity);
            var exclude = cParams.subForms[formLevel].confg.exclude;
            return buildRows(dfltFields, exclude);
        }
        /** Adds fields specific to a sub-entity. */
        function buildAdditionalRows() {                                        //console.log("    Building additional rows");
            var addedFields = cParams.subForms[formLevel].confg.add;
            return buildRows(addedFields);
        }
        /**
         * Builds a row for each field not explicitly excluded from the fieldGroup. 
         * If exclude is set to true, all default fields are excluded. 
         */
        function buildRows(fieldGroup, exclude) {
            var rows = [];
            for (var field in fieldGroup) {                                     //console.log("      field = ", field);
                if (exclude && (exclude === true || exclude.indexOf(field) !== -1)) { continue; }                //console.log("      field = ", field);
                rows.push(buildRow(field, fieldGroup, formLevel));
            }
            return rows;
        }
        /**
         * Builds field input @buildFieldType, stores whether field is required, 
         * and sends both to @buildFormRow, returning the completed row elem.
         * Sets the value for the field if it is in the passed 'fieldVals' obj. 
         */
        function buildRow(field, fieldsObj, formLevel) {
            var fieldInput = buildFieldType[fieldsObj[field]](entity, field);      
            var reqFields = cParams.subForms[formLevel].confg.required;
            var isReq = reqFields.indexOf(field) !== -1;
            var rowClass = fieldsObj[field] === "fullTextArea" ? "long-sub-row" : "";
            if (field in fieldVals) { $(fieldInput).val(fieldVals[field]); }
            return buildFormRow(_util.ucfirst(field), fieldInput, formLevel, isReq, rowClass);
        }
    } /* End getFormFieldRows */
    /** Reorders the rows into the order set in the form config obj. */
    function orderRows(rows, order) {                                           //console.log("    ordering rows = %O, order = %O", rows, order);
        var field, idx;
        rows.forEach(function(row) {
            field = row.id.split("_row")[0];
            idx = order.indexOf(field);
            order.splice(idx, 1, row);
        });
        return order;
    }

    function buildTextInput(entity, field) {                         
        return _util.buildElem("input", { "type": "text", class: "med-field" });
    }
    function buildTextArea(entity, field) {                                     
        return _util.buildElem("textarea", {class: "med-field" });
    }
    function buildLongTextArea(entity, field) {
        return _util.buildElem("textarea", {class: "xlrg-field"});
    }
    /**
     * Creates and returns a select dropdown for the passed field. If it is one of 
     * a larger set of select elems, the current count is appended to the id. Adds 
     * the sel's fieldName to the subForm's 'selElem' array to later init 'selectize' 
     * combobox. Adds a data property "valType" for use later during validation.
     */
    function buildSelectElem(entity, field, cnt) {                                   
        var formLvl = cParams.subForms[entity];
        var fieldName = field.split(" ").join("_");
        var opts = getSelectOpts(fieldName);                                    //console.log("entity = %s. field = %s, opts = %O ", entity, field, opts);
        var fieldId = cnt ? fieldName+"-sel"+cnt : fieldName+"-sel";
        var sel = _util.buildSelectElem(opts, { id: fieldId , class: 'med-field'});
        cParams.subForms[formLvl].selElems.push(fieldName);
        $(sel).data("valType", "select");
        return sel;
    }
    /** Returns and array of options for the passed field type. */
    function getSelectOpts(field) {                                             //console.log("getSelectOpts. for %s", field);
        var optMap = {
            "Authors": [ getOptsFromStoredData, 'authors'],
            "Citation_Type": [ getTypeOpts, 'citTypes'],
            "Publication_Type": [ getTypeOpts, 'pubTypes'],
            "Publisher": [ getOptsFromStoredData, 'publishers'],
            "Tags": [ getTagOpts, 'citation' ],
            "Location_Type": [ getLocationTypeOpts, 'locTypes'],
            "Habitat_Type": [ getTypeOpts, 'habTypes'],
        };
        var getOpts = optMap[field][0];
        var fieldKey = optMap[field][1];
        return getOpts(fieldKey);
    }
    /** Builds options out of a stored entity collection object. */
    function getOptsFromStoredData(prop) {                                      //console.log("prop = ", prop)
        return buildOptsObj(JSON.parse(localStorage.getItem(prop)));
    }
    /** Builds options out of the entity's stored 'types' array. */
    function getTypeOpts(typeKey) {
        var typeAry = JSON.parse(localStorage.getItem(typeKey)).sort()
        return _util.buildSimpleOpts(typeAry);
    }
    /** Builds options out of the entity object, with id as 'value'. */
    function buildOptsObj(entityObj) {
        var sortedNameKeys = Object.keys(entityObj).sort();
        return sortedNameKeys.map(function (name) {
            return { value: entityObj[name], text: name }
        });    
    }
    /**
     * Returns options for the location types that can be created by a general editor. 
     * Regions and Countries will be available for a higher-level access editor.
     */
    function getLocationTypeOpts(typeKey) {
        var typeAry = JSON.parse(localStorage.getItem(typeKey)).sort(); 
        typeAry.splice(typeAry.indexOf("region"), 1); 
        typeAry.splice(typeAry.indexOf("country"), 1); 
        return _util.buildSimpleOpts(typeAry);    
    }
    /**
     * Returns an array of options objects for tags of the passed entity.
     * Note: Hardcoded temporarily. 
     */
    function getTagOpts(entity) {
        var tags = {
            "citation": ["Secondary"],
        };
        return tags[entity].map(function(tag) {
            return { "value": tag, "text": tag };
        });
    }
    /**
     * Creates a select dropdown field wrapped in a div container that will
     * be reaplced inline upon selection. Either with an existing Author's name, 
     * or the Author create form when the user enters a new Author's name. 
     */
    function buildMultiSelectElem(entity, field) {                              //console.log("entity = %s. field = ", entity, field);
       var cntnr = _util.buildElem("div", { id: field+"_sel-cntnr"});
       var selElem = buildSelectElem(entity, field, 1);
       $(cntnr).data("cnt", 1);
       $(cntnr).data("valType", "multiSelect");
       $(cntnr).append(selElem);
       return cntnr;
    }
    /**
     * Each element is built, nested, and returned as a completed row. 
     * rowDiv>(errorDiv, fieldDiv>(fieldLabel, fieldInput))
     */
    function buildFormRow(fieldName, fieldInput, formLevel, isReq, rowClss) {
        var rowClasses = { "top": "form-row", "sub": "sub-row", "sub2": "sub2-row" };
        var rowClass = rowClasses[formLevel] + " " + rowClss;
        var field = fieldName.split(' ').join('');
        var rowDiv = _util.buildElem("div", { class: rowClass, id: field + "_row"});
        var errorDiv = _util.buildElem("div", { class: "row-errors", id: field+"_errs"});
        var fieldRow = _util.buildElem("div", { class: "field-row flex-row"});
        var label = _util.buildElem("label", {text: _util.ucfirst(fieldName)});
        if (isReq) { handleRequiredField(label, fieldInput, formLevel); } 
        $(fieldRow).append([label, fieldInput]);
        $(rowDiv).append([errorDiv, fieldRow]);
        return rowDiv;
    }
    /**
     * Required field's have a 'required' class added which appends '*' to their 
     * label. Added to the input elem is a change event reponsible for enabling/
     * disabling the submit button and a form-level data property. The input elem
     * is added to the form param's reqElems property. 
     */
    function handleRequiredField(label, input, formLevel) {
        $(label).addClass('required');  
        $(input).change(checkRequiredFields);
        $(input).data("formLvl", formLevel);
        cParams.subForms[formLevel].reqElems.push(input);
    }
    /**
     * On a required field's change event, the submit button for the element's form 
     * is enabled if all of it's required fields have values and it has no open child forms. 
     */
    function checkRequiredFields(e) {  
        var input = e.currentTarget;
        var formLvl = $(input).data("formLvl");  
        var subBttnId = '#'+formLvl+'_submit';
        if (!input.value || hasOpenSubForm(formLvl)) { 
            disableSubmitBttn(subBttnId); 
        } else if (ifRequiredFieldsFilled(formLvl)) { 
            enableSubmitBttn(subBttnId);
        }
    }
    /** Returns true if all the required elements for the current form have a value. */
    function ifRequiredFieldsFilled(formLvl) {
        var reqElems = cParams.subForms[formLvl].reqElems;
        return reqElems.every(function(reqElem){ return reqElem.value; }); 
    }
    /** Returns true if the next sub-level form exists in the dom. */
    function hasOpenSubForm(formLvl) {
        var childFormLvl = getNextFormLevel('child', formLvl);
        return $('#'+childFormLvl+'-form').length > 0;
    }
    /**
     * Returns a container with 'Create [Entity]' and 'Cancel' buttons bound to events
     * specific to their form container @getBttnEvents, and a left spacer that 
     * pushes the buttons to the bottom right of their form container.
     */
    function buildFormBttns(entity, level, parentElemId) {
        var events = getBttnEvents(entity, level, parentElemId);                //console.log("events = %O", events);
        var cntnr = _util.buildElem("div", { class: "flex-row bttn-cntnr" });
        var spacer = $('<div></div>').css("flex-grow", 2);
        var submit = _util.buildElem("input", { id: level + "_submit", 
            class: "ag-fresh grid-bttn", type: "button", value: "Create "+entity});
        var cancel = _util.buildElem("input", { id: level +"_cancel", 
            class: "ag-fresh grid-bttn", type: "button", value: "Cancel"});
        $(submit).attr("disabled", true).css("opacity", ".6").click(events.submit);
        $(cancel).css("cursor", "pointer").click(events.cancel);
        $(cntnr).append([spacer, submit, cancel]);
        return cntnr;
    }
    /**
     * Returns an object with 'submit' and 'cancel' events bound to the passed level's
     * form container.  
     */
    function getBttnEvents(entity, level, parentElemId) { 
        return { 
            submit: getFormValuesAndSubmit.bind(null, '#'+level+'-form', level, entity), 
            cancel: exitForm.bind(null, '#'+level+'-form', level, parentElemId) 
        };
    }
    /**
     * Removes the form container with the passed id, clears and enables the combobox,
     * and contextually enables to parent form's submit button @ifParentFormValid. 
     */
    function exitForm(id, formLevel, parentElemId) {                            //  console.log("id = %s, formLevel = %s, id = %s", id, formLevel, parentElemId)      
        var parentLvl = getNextFormLevel('parent', formLevel);
        var selectized = cParams.selectizeApi[parentLvl][parentElemId];      
        selectized.clear();
        selectized.enable();
        $(id).remove();
        ifParentFormValid(parentLvl);
    }
    /** Returns the 'next' form level- either the parent or child. */
    function getNextFormLevel(nextLvl, curLvl) {
        var formLevels = cParams.formLevels;
        var nextLvl = nextLvl === "parent" ? 
            formLevels[formLevels.indexOf(curLvl) - 1] : 
            formLevels[formLevels.indexOf(curLvl) + 1] ;
        return nextLvl;
    }
    /** Enables the parent form's submit button if all required fields have values. */
    function ifParentFormValid(parentLvl) {
        if (ifRequiredFieldsFilled(parentLvl)) {
            enableSubmitBttn('#'+parentLvl+'_submit');
        }
    }
    /** Enables passed submit button */
    function enableSubmitBttn(bttnId) {  
        $(bttnId).attr("disabled", false).css({"opacity": "1", "cursor": "pointer"}); 
    }  
    /** Enables passed submit button */
    function disableSubmitBttn(bttnId) {
        $(bttnId).attr("disabled", true).css({"opacity": ".6", "cursor": "initial"}); 
    }    
/*--------------------------- Helpers ----------------------------------------*/
    /*------------------- Error Handlers -------------------------------------*/
    /**
     * When the user attempts to create an entity that uses the sub2-form and
     * there is already a sub2-form instance, show the user an error message and 
     * reset the select elem. 
     */
    function openSub2FormError(field, selElemId) {                              //console.log("selElemId = %s, cP = %O ", selElemId, cParams)
        var selectizedElem = cParams.selectizeApi["sub"][selElemId];
        crudFieldErrorHandler(field, 'openSub2Form');
        window.setTimeout(function() {clearCombobox(selectizedElem)}, 10);
        return { "value": "", "text": "Select " + field };
    }
    /** Shows the user an error message above the field row. */
    function crudFieldErrorHandler(fieldName, errorTag, fieldErrElem) {         //console.log("###__crudFieldError- '%s' for '%s'. ErrElem = %O", fieldName, errorTag, fieldErrElem);
        var errMsgMap = {
            "emptyRequiredField" : "<p>Please fill in "+fieldName+".</p>",
            "openSub2Form": "<p>Please finish the open "+ 
                _util.ucfirst(cParams.subForms.sub2.entity) + " form.</p>",
        };
        var msg = errMsgMap[errorTag];
        var errElem = fieldErrElem || getErrElem(fieldName);
        errElem.innerHTML = msg;
        window.setTimeout(function(){errElem.innerHTML = ""}, 5000);
    }
    /** Returns the error div for the passed field. */
    function getErrElem(fieldName) {                                            //console.log("getErrElem for %s", fieldName);
        var field = fieldName.split(' ').join('');
        return $('#'+field+'_errs')[0];    
    }    
    /*----------------------- Form Submission -----------------------------------------------------*/
    /**
     * Loops through all rows in the form with the passed id and builds an object of 
     * filled field values keyed under server-ready field names to submit @submitFormVals.
     * Realted parent-form field values are handled @getParentFormVals   
     */
    function getFormValuesAndSubmit(id, formLvl, entity) {  
        var fieldName, input;
        var elems = $(id)[0].children;   
        var needsParentVals = ["Citation", "Location"];  
        var formVals = {};
        for (var i = 1; i < elems.length-1; i++) {                              //console.log("elems[i] = %O", elems[i])
            fieldName = _util.lcfirst(elems[i].children[1].children[0].innerText.trim().split(" ").join("")); 
            input = elems[i].children[1].children[1];
            if ($(input).data("valType") == "multiSelect") { getMultiSelectVals(fieldName, input); }
            if (input.value) { formVals[fieldName] = input.value; }
        }            
        if (needsParentVals.indexOf(entity) !== -1) { getParentFormVals(); }                                                           
        submitFormVals(formLvl, formVals);
        /** Adds an array of selected values in the passed select container. */
        function getMultiSelectVals(fieldName, cntnr) {
            var vals = [];
            var elems = cntnr.children;  
            for (var i = 0; i <= elems.length-1; i+= 2) { 
                if (elems[i].value) { vals.push(elems[i].value); }
            }
            formVals[fieldName] = vals;
        }
        /** Get's the value of a realted form field elem in the parent form. */
        function getParentFormVals() {
            var relFormFields = {
                "Citation": "publication", "Location": "country"
            };
            var newField = relFormFields[entity];  console.log("new fieldName = ", newField)
            formVals[newField] = $('#'+_util.ucfirst(newField)+'-sel').val();
        }
    } /* End getFormValuesAndSubmit */
    /**
     * Builds a form data object @buildFormData. Sends it to the server @ajaxFormData
     */
    function submitFormVals(formLvl, formVals) {                        
        var entity = cParams.subForms[formLvl].entity;                          //console.log("Submitting [ %s ] [ %s ]-form with vals = %O", entity, formLvl, formVals);  
        var fieldTrans = getFieldTranslations(entity);
        var formData = buildFormDataObj(entity, formVals);
        ajaxFormData(formData, formLvl);
    }                
    /**
     * Returns a form data object with the server entity names' as keys for their 
     * data, field-val, objects. Field translations are handled @addTransFormData. 
     * If the passed entity is a detail entity for a 'parent' entity, eg Source or 
     * Location, that entity is added to a 'type' field of the parent. 
     */
    function buildFormDataObj(entity, formVals) { 
        var data = {}
        var pEntity = getParentEntity(entity);
        var parentFields = pEntity === false || getParentFields(entity);   
        var fieldTrans = getFieldTranslations(entity);                          //console.log("buildFormDataObj. formVals = %O, fieldTrans = %O, parentFields = %O", formVals, fieldTrans, parentFields);
        data[pEntity] = {};
        data[entity] = {};

        for (var field in formVals) {                                           //console.log("processing field = ", field)
            if (fieldTrans && field in fieldTrans) { addTransFormData(field, formVals[field]); 
            } else { addFormData(field, formVals[field]); }
        }                                                                       //console.log("formData = %O", data);
        if (pEntity) { data[pEntity][pEntity+"Type"] = entity; }    
        return data;
        /** Translates the passed field into it's server-ready equivalent. */
        function addTransFormData(field, val) {
            var transMap = fieldTrans[field];
            for (var ent in transMap) { data[ent][transMap[ent]] = val; }
        }
        /** Adds the passed field and value to the appropriate entity data object. */
        function addFormData(field, val) {
            var ent = (pEntity && parentFields.indexOf(field) !== -1) ? pEntity : entity;
            data[ent][field] = val;
        }
    } /* End buildFormDataObj */
    /**
     * If the passed entity is a detail, child, entity, the parent entity name is returned.
     */
    function getParentEntity(entity) {
        var parentEntities = {
            "author": "source",         "citation": "source",
            "publication": "source",    "publisher": "source",
        };
        return parentEntities[entity] || false;
    }
    /** Returns an array of the parent entity's field names. */
    function getParentFields(entity) {
        var parentFields = Object.keys(getParentEntityFields(entity));
        return  parentFields.map(function(field) {
            return _util.lcfirst(field.split(" ").join(""));
        });
    }
    /** 
     * Returns a object with the form's field names as keys for field translation objects
     * with the appropraite entity name key and the field name translation. 
     */
    function getFieldTranslations(entity) {  
        var fieldTrans = {
            "publication": { 
                "authors": { "source": "contributor" },
                "publisher": { "source": "parentSource" }, 
                "title": { "source": "displayName", "publication": "displayName" },
            },
            "citation": { 
                "authors": { "source": "contributor" },
                "citationText": { "source": "description", "citation": "fullText" },
                "publication": { "source": "parentSource" },
                "title": { "source": "displayName", "citation": "displayName",
                    "citation": "title" },
            },
            "author": {
                "displayName": { "source": "displayName", "author": "displayName" }
            }
        };
        return fieldTrans[entity] || false;
    }

    /*------------- AJAX -----------------------------------------------------*/
    /** Sends the passed form data object via ajax to the appropriate controller. */
    function ajaxFormData(formData, formLvl) {                                  console.log("ajaxFormData [ %s ]= %O", formLvl, formData);
        // var stubData = {};
        // stubData[cParams.subForms[formLvl].entity] = "123456";
        var topEntity = getParentEntity(cParams.subForms[formLvl].entity);  console.log("entity = ", topEntity);
        var url = getEntityUrl(topEntity, cParams.action);
        cParams.ajaxFormLvl = formLvl;
        sendAjaxQuery(formData, url, formSubmitSucess);
        // window.setTimeout(function() { formSubmitSucess({ "source": stubData }) }, 500);
    }
    /** Returns the full url for the passed entity and action.  */
    function getEntityUrl(entityName, action) {
        return envUrl + "admin/crud/" + entityName + "/" + action;
    }
    /**
     * Ajax success callback. Exit's the successfully submitted form, adds and 
     * selects an option with the new entities id (val) and display name (text).
     * Potential format for response: {[pEntity] : {[formEntity] => [id]} }
     */
    function formSubmitSucess(data, textStatus, jqXHR) {                        console.log("Ajax Success! data = %O, textStatus = %s, jqXHR = %O", data, textStatus, jqXHR);
        var formLvl = cParams.ajaxFormLvl;
        var pFormLvl = getNextFormLevel("parent", formLvl);
        var formSelId = cParams.subForms[formLvl].pSelElemId;  
        var selElemApi = cParams.selectizeApi[pFormLvl][formSelId]; 

        // exitForm("#"+formLvl+"-form", formLvl, formSelId); 
        // selElemApi.addOption({ "value": "123456", "text": "Testing Successful" });
        // selElemApi.addItem("123456");
    }
    










 
/*--------------------- Content Block WYSIWYG --------------------------------*/
    /**
     *  Adds edit content button to the top of any page with editable content blocks.
     */
    function initWysiwyg() {
        var contentBlocks = $('.wysiwyg');                                      //console.log("contentBlocks = %O", contentBlocks);
        if (contentBlocks.length > 0) { addEditContentButton(); }
    } /* End initWysiwyg */
    function addEditContentButton() {
        var button = $('<button/>', {
            text: "Edit Content", 
            id: 'editContentBttn',
            class: 'adminbttn',
            click: toggleContentBlockEditing
        });  //console.log("button = %O", button)
        button.css({
            position: "absolute",
            top: "8px",         // We were using px for the 'batplant.org' just above this button...  
            right: "10px"       // in the interest of visual consistency, I am using px to style this as well.
        });
        $('#hdrtext').append(button);
        $('#editContentBttn').data('editing', false);  // tracks which content block contains the active editor, if any.
    }
    /**
     * Manages init and exit 'edit states' and related ui on the page.
     */
    function toggleContentBlockEditing() { 
        var editorElem = $('#editContentBttn').data('editing');      //   console.log("togggling.  editorElem = %O", editorElem)
        if (editorElem !== false) {
            $('#editContentBttn').text("Refreshing...");
            location.reload(true);
        } else {
            addEditPencils();
            $('#editContentBttn').data('editing', true)
            $('#editContentBttn').text("Cancel Edit");
        }
    }
    /**
     * Extends the Trumbowyg library to include 'save' and 'cancel' buttons 
     * for the interface. The save button updates the content block in the 
     * database and then refreshes the page. 
     */
    function addButtons() {
        (function($) {
            $.extend(true, $.trumbowyg, { 
                langs: {
                    en: {
                        save: 'Save',
                        cancel: 'Cancel'
                    },
                },
                plugins: {
                    save: { // plugin name
                        init: function(trumbowyg) { 
                            const btnDef = {
                                hasIcon: false,
                                fn: function() {                            // console.log("saving. trumbowyg = %O", trumbowyg );
                                    var blkId = trumbowyg.o.plugins.save.id;
                                    var data = { content: $('#' + blkId ).trumbowyg('html')};            // console.log("blkId = ", blkId)
                                    var url = "admin/contentblock/" + blkId + "/update";
                                    sendAjaxQuery(data, url, wysiwygSubmitSuccess);
                                    // $.ajax({
                                    //     method: "POST",
                                    //     url: "admin/contentblock/" + blkId + "/update",
                                    //     success: wysiwygSubmitSuccess,
                                    //     error: ajaxError,
                                    //     data: JSON.stringify()
                                    // });
                                }
                            };
                            trumbowyg.addBtnDef('save', btnDef);
                        }
                    }
                }
            });
        })(jQuery);
    } /* End addButtons */
    /** Reloads the page on content block update success */
    function wysiwygSubmitSuccess(data, textStatus, jqXHR) { 
        console.log("Success is yours!! = %O", data);
        location.reload(true);
    }
    /** Returns the block container id by removing '-edit' from the passed editId */
    function getBlockContainerId(editId) {
        var elemIdAry = editId.split('-'); 
        elemIdAry.pop();
        return elemIdAry.join('-');
    }
    /** 
     * Adds edit pencil icons to the top left of every content block container,
     * any div with class 'wysiwyg', on the page.
     */
    function addEditPencils() {     
        var editIcoSrc = ($('body').data('env') === "dev" ? '../' : '') + 'bundles/app/images/eif.pencil.svg';  
        var contentBlocks = $('.wysiwyg');  //console.log("contentBlocks = %O", contentBlocks);
        
        for (var i = 0; i < contentBlocks.length; i++) {
            var blkId = contentBlocks[i].id;  //console.log("blkId = ", blkId);
            var blkEditId = blkId + '-edit';
            $('#' + blkId).append('<img src="' + editIcoSrc + '" ' + 'id="' + blkEditId + '" ' +
            'class="wsywigEdit" title="Edit Content" alt="Edit Content">');
            addButtons(blkEditId, blkId);
        }
        $('.wsywigEdit').click(startWysiwyg);
        /** Starts the wysiwyg editor. If 'super' admin, includes additional buttons. */
        function startWysiwyg(e) { // console.log("starting! e.parent = %O", e.target)
            var containerElemId = getBlockContainerId(e.target.id); //console.log("containerElemId = ", containerElemId)
            var bttns = [
                ['formatting'],
                'btnGrp-semantic',
                // ['superscript', 'subscript'],
                ['link'],
                // ['insertImage'],
                'btnGrp-justify',
                'btnGrp-lists',
                ['horizontalRule'],
                ['save']
            ];
            $('#editContentBttn').data('editing', containerElemId); // tracks which content block contains the active editor
            removeEditPencils();   //adds developer buttons
            
            if (userRole === "super") { bttns.splice(6, 0, ['viewHTML', 'removeformat']); }
            
            $('#' + containerElemId).trumbowyg({    
                btns: bttns,
                autogrow: false,
                plugins: {  // options object unique to each instance of the wysiwyg.
                    save: {
                        id: containerElemId
                    }
                }
            });
        }
    } /* End addEditPencils */
    /** Removes every edit pencil icon on the page */
    function removeEditPencils() {
        $('.wsywigEdit').remove();  
    }
/*-----------------AJAX Callbacks---------------------------------------------*/
    function sendAjaxQuery(dataPkg, url, successCb) {                           console.log("Sending Ajax data =%O arguments = %O", dataPkg, arguments)
        $.ajax({
            method: "POST",
            url: url,
            success: successCb || dataSubmitSucess,
            error: ajaxError,
            data: JSON.stringify(dataPkg)
        });
    }
    /**
     * Stores reference objects for posted entities with each record's temporary 
     * reference id and the new database id.     
     * Interactions are sent in sets of 1000, so the returns are collected in an array.
     */
    function dataSubmitSucess(data, textStatus, jqXHR) { 
        console.log("Ajax Success! data = %O, textStatus = %s, jqXHR = %O", data, textStatus, jqXHR);
    }
    function ajaxError(jqXHR, textStatus, errorThrown) {
        console.log("ajaxError = %s - jqXHR:%O", errorThrown, jqXHR);
    }

}());  // End of namespacing anonymous function 