(function(){  console.log("Anything you can do, you can do awesome...");
	var columnDefs = [];
	var rowData = [];
	var gridOptions = {
	    columnDefs: columnDefs,
	    rowData: rowData
	};

	document.addEventListener('DOMContentLoaded', onDOMContentLoaded); 

	function onDOMContentLoaded () {
		$("select[name='search-focus']").change(selectSearchFocus);
	    // var gridDiv = document.querySelector('#myGrid');
	    new agGridGlobalFunc('#search-grid', gridOptions);

		selectSearchFocus();
	}

	function selectSearchFocus(e) {
	    if ( $('#search-focus').val() == 'taxa' ) { getDomains();  }
	}
/*------------------Taxa Search Methods---------------------------------------*/
	function getDomains() {
		var dataPkg = {
			repo: 'domain',
			repoQ: 'findAll',
			props: ['slug', 'name']		//Idx0 = findOneBy
		};
		sendAjaxQuery(dataPkg, 'ajax/search', showTaxonSearchMethods)
	}
	function showTaxonSearchMethods(data) {  console.log("data recieved. %O", data);
		buildTaxaSearchHtml(data);
		$("input[name='searchMethod']").change(taxaSearchMethod);

		taxaSearchMethod();
	}
	function taxaSearchMethod(e) { console.log("change fired");
	    if ( $('input[name="searchMethod"]:checked').val() == 'textSearch' ) {
	   		$("input[name='textEntry']").attr('disabled', false);
	   		$('#sel-domain').attr('disabled', true);
	    } else {  // Browse Taxa Names
	        $("input[name='textEntry']").attr('disabled', true);
	   		$('#sel-domain').attr('disabled', false);
			$('#sel-domain').change(selectTaxaDomain);

			selectTaxaDomain();
	    }
	}
	function selectTaxaDomain(e) {
    	if ( $('#sel-domain').val() === 'bat' ) { console.log("bats is selected") }  //showBatLevels();
    	if ( $('#sel-domain').val() === 'arthropod' ) { showBugLevels(); console.log("bugs is selected") }  //showBatLevels();
	}
	function showBugLevels() {
		var params = {
			repo: 'domain',
			id: 'arthropod',
			props: ['displayName', 'slug' ],
			refProps: ['parentTaxon', 'level'],
			roles: ['ObjectRoles']
		};
		sendAjaxQuery(params, 'ajax/search/taxa', buildBugLvlHtml);
	}
	function buildBugLvlHtml(data) { console.log("Success is yours. Data = %O", data);
		var taxaIntRcrds = separateByLevel(data.results);   console.log("taxaIntRcrds = %O", taxaIntRcrds);
		var elems = buildBugSelects(buildLvlOptions(taxaIntRcrds));

		$('#opts-row2').append(elems);
	}
	function buildBugSelects(lvlOpts) {
		var selElems = [];
		selElems.push(createElem('span', { text: "Class: " }));
		selElems.push(buildSelectElem(lvlOpts.Class, { class: "opts-box", id: "selClass" }));
		selElems.push(createElem('span', { text: "Order: " }));
		selElems.push(buildSelectElem(lvlOpts.Order, { class: "opts-box", id: "selOrder" }));
		selElems.push(createElem('span', { text: "Family: " }));
		selElems.push(buildSelectElem(lvlOpts.Family, { class: "opts-box", id: "selFam" }));
		selElems.push(createElem('span', { text: "Genus: " }));
		selElems.push(buildSelectElem(lvlOpts.Genus, { class: "opts-box", id: "selGenus" }));
		selElems.push(createElem('span', { text: "Species: " }));
		selElems.push(buildSelectElem(lvlOpts.Species, { class: "opts-box", id: "selSpecies" }));
		return selElems;
	}
	function buildLvlOptions(rcrds) {
		var optsObj = {};
		for (var lvl in rcrds) {
			var taxaNames = Object.keys(rcrds[lvl]).sort(); console.log("taxaNames = %O", taxaNames);
			optsObj[lvl] = buildTaxaOptions(taxaNames, rcrds[lvl]);
		}
		return optsObj;
	}
	function buildTaxaOptions(taxaNames, rcrds) {
		return taxaNames.map(function(taxaKey){
			return {
				value: rcrds[taxaKey].slug,
				text: taxaKey
			};
		});
	}
	function separateByLevel(rcrds) {
		var levels = ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'];
		var topLvl = 6;
		var separated = {};

		for (var taxon in rcrds){
			if (separated[rcrds[taxon].level] === undefined) { separated[rcrds[taxon].level] = {}; }
			// Not doing anything with top level currently, but during refactor it may be more useful.
			if (levels.indexOf(rcrds[taxon].level) < topLvl) { topLvl = levels.indexOf(rcrds[taxon].level); }
			
			separated[rcrds[taxon].level][rcrds[taxon].displayName] = rcrds[taxon];
		}
		return separated;
	}
	function batLevelsHtml() {
		return `<span>Family: </span>
				<select id="family" class="opts-box"></select>
				<span>Genus: </span>
				<select id="genus" class="opts-box"></select>
				<span>Species: </span>
				<select id="species" class="opts-box"></select>`;
	}
	function buildTaxaSearchHtml(data) {
		var txtSearchElems = buildTxtSearchElems();
		var browseElems = buildBrowseElems();
		var domainOpts = getDomainOpts(data.results); console.log("domainOpts = %O", domainOpts);
		$(browseElems).append(buildSelectElem(domainOpts, { class: 'opts-box', id: 'sel-domain' }));

		$('#focus-top-opts').append([txtSearchElems, browseElems]);
		/*-- Init State --*/
		$('input[name="searchMethod"][value=browseSearch]').prop('checked', true);
		$('#sel-domain').val('arthropod');

        function getDomainOpts(data) {
        	var optsAry = [];
        	for (var rcrdId in data) { console.log("rcrdId = %O", data[rcrdId]);
        		optsAry.push({ value: data[rcrdId].slug, text: data[rcrdId].name });
        	}
        	return optsAry;
        }
		function buildTxtSearchElems() {
			var elems = createElem('label');
			$(elems).append(createElem('input', { name: 'searchMethod', type: 'radio', value: 'textSearch' })); 
			$(elems).append(createElem('span', { text: "Text Search" })); // console.log("elems = %O", elems)
			$(elems).append(createElem('input', { class:'opts-box', name: 'textEntry', type: 'text', placeholder: 'Enter Taxon Name' })); 
			return elems;
		}
		function buildBrowseElems() {
			var elems = createElem('label');
			$(elems).append(createElem('input', { name: 'searchMethod', type: 'radio', value: 'browseSearch' })); 
			$(elems).append(createElem('span', { text: "Browse Taxa Names" })); // console.log("elems = %O", elems)
			return elems;
		}
	} /* End buildTaxaSearchHtml */
/*----------------------Util----------------------------------------------------------------------*/
	function buildSelectElem(options, attrs) {
		var selectElem = createElem('select', attrs); 

		options.forEach(function(opts){
			$(selectElem).append($("<option/>", {
			    value: opts.value,
			    text: opts.text
			}));
		});
		return selectElem;
	}
	function createElem(tag, attrs) {   console.log("createElem called. tag = %s. attrs = %O", tag, attrs);// attr = { id, class, name, type, value, text }
	    var elem = document.createElement(tag);
	
		if (attrs) {
		    elem.id = attrs.id || '';
		    elem.className = attrs.class || '';   //Space seperated classNames

		    if (attrs.text) { $(elem).text(attrs.text); }

		    if (attrs.name || attrs.type || attrs.value ) { 
		    	$(elem).attr({
		    		name: attrs.name   || '', 
		    		type: attrs.type   || '',
		    		value: attrs.value || '',
		    		placeholder: attrs.placeholder || '',
		    	}); 
		    }
		}
	
	    // if (parentElem) { parentElem.appendChild(elem); }

	    return elem;
	}
/*-----------------AJAX ------------------------------------------------------*/
	function sendAjaxQuery(dataPkg, url, successCb) {  console.log("Sending Ajax data =%O", dataPkg)
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
		var entity = "Your Mom";										console.log("--%s Success! data = %O, textStatus = %s, jqXHR = %O", entity, data, textStatus, jqXHR);
		// if ( entity === "interaction" ) {
		// 	if ( postedData.interaction === undefined ) { postedData.interaction = []; }
		// 	postedData.interaction.push( data[entity] );	
		// } else {
		// 	postedData[entity] = data[entity];  
		// }
	}
	function ajaxError(jqXHR, textStatus, errorThrown) {
		console.log("ajaxError = %s - jqXHR:%O", errorThrown, jqXHR);
	}
}());