/**
 * Builds a data tree out of the records for the selected data view. 
 *
 * Code Sections:
 *     LOCATION TREE
 *     SOURCE TREE
 *         PUBLICATION SOURCE TREE
 *         PUBLISHER SOURCE TREE
 *         AUTHOR SOURCE TREE
 *     TAXON TREE
 *     INTERACTION FILL METHODS
 *     FILTER BY TEXT
 *     FILTER BY INTERACTION SET
 * 
 * Exports:         Imported by:
 *     buildLocTree     db-page, save-ints
 *     buildSrcTree     db-page, save-ints
 *     buildTxnTree     db-page, save-ints
 */
import { accessTableState as tState } from '../../db-main.js';
import * as _u from '../../util/util.js';

let focusRcrds; //Refreshed with each new entry into the module.
let tblState;
/* ========================= LOCATION TREE ========================================================================== */
/**
 * Builds a tree of location data with passed locations at the top level, and 
 * sub-locations as nested children. 
 * Note: If loading a user-named data set (intSet), only the entities within 
 * those interactions are added to the data tree.
 */ 
export function buildLocTree(topLocs, textFltr) {                               
    tblState = tState().get(null, ['rcrdsById', 'intSet']);
    focusRcrds = tblState.rcrdsById;
    return fillTreeWithInteractions('locs', buildLocDataTree(topLocs, textFltr));
}
function buildLocDataTree(topLocs, textFltr) {
    let topLoc;
    let tree = {};                                                              //console.log("tree = %O", tree);
    topLocs.forEach(function(id){  
        topLoc = _u.getDetachedRcrd(id, focusRcrds);  
        tree[topLoc.displayName] = getLocChildren(topLoc);
    });  
    tree = filterTreeByText(textFltr, tree);
    tree = filterTreeToInteractionSet(tree, 'locs');
    return sortDataTree(tree);
}
/** Returns the location record with all child ids replaced with their records. */
function getLocChildren(rcrd) {   
    if (rcrd.children.length > 0) { 
        rcrd.children = rcrd.children.map(getLocChildData);
    }
    return rcrd;
}
function getLocChildData(childId) {  
    return getLocChildren(_u.getDetachedRcrd(childId, focusRcrds));
}
/* ========================= SOURCE TREE ============================================================================ */
/** (Re)builds source tree for the selected source realm. */
export async function buildSrcTree(realm) {
    tblState = tState().get(null, ['rcrdsById', 'intSet']);
    focusRcrds = tblState.rcrdsById;
    const tree = await buildSrcRealmTree(realm);
    return fillTreeWithInteractions('srcs', tree);
}
/**
 * Builds the source data tree for the selected source realm (source type)
 * NOTE: Sources have three realms and tree-data structures:
 * Authors->Citations/Publications->Interactions
 * Publications->Citations->Interactions. 
 * Publishers->Publications->Citations->Interactions. 
 */
function buildSrcRealmTree(realm) {     
    const bldr = { 'pubs': buildPubTree, 'auths': buildAuthTree, 'publ': buildPublTree };
    const realmSrcKey = getSrcRcrdKey(realm);
    return Promise.all([_u.getData(['publication', 'author']),_u.getData(realmSrcKey)])
        .then(data => { 
            const srcData = data[1].map(id => _u.getDetachedRcrd(id, focusRcrds))
            let tree = bldr[realm](srcData, data[0]);
            tree = filterTreeToInteractionSet(tree, 'srcs');
            return sortDataTree(tree);
        }).catch(e => console.log('e = %O', e));
}  
function getSrcRcrdKey(realm) {
    const keys = { 'auths': 'authSrcs', 'pubs': 'pubSrcs', 'publ': 'pubSrcs' };
    return keys[realm];
}
/*-------------- Publication Source Tree -------------------------------------------*/
/**
 * Returns a tree object with Publications as the base nodes of the data tree. 
 * Each interaction is attributed directly to a citation source, which currently 
 * always has a 'parent' publication source.
 * Data structure:
 * ->Publication Title
 * ->->Citation Title
 * ->->->Interactions Records
 */
function buildPubTree(pubSrcRcrds, data) {                                      //console.log("buildPubSrcTree. Tree = %O", pubSrcRcrds);
    const pubRcrds = data.publication;
    const tree = {};
    pubSrcRcrds.forEach(function(pub) { 
        tree[pub.displayName] = getPubData(pub, pubRcrds); 
    });
    return tree;
}
function getPubData(rcrd, pubRcrds) {                                           //console.log("getPubData. rcrd = %O", rcrd);
    rcrd.children = getPubChildren(rcrd, pubRcrds);
    if (rcrd.publication) {                                                     //console.log("rcrd with pub = %O", rcrd)
        rcrd.publication = _u.getDetachedRcrd(rcrd.publication, pubRcrds);
    }
    return rcrd;
}
function getPubChildren(rcrd, pubRcrds) {                                       //console.log("getPubChildren rcrd = %O", rcrd)
    if (rcrd.children.length === 0) { return []; }
    return rcrd.children.map(id => getPubData(
        _u.getDetachedRcrd(id, focusRcrds), pubRcrds));
}
/*-------------- Publisher Source Tree ---------------------------------------*/
/**
 * Returns a tree object with Publishers as the base nodes of the data tree. 
 * Publications with no publisher are added underneath the "Unspecified" base node.
 * Data structure:
 * ->Publisher Name
 * ->->Publication Title
 * ->->->Citation Title
 * ->->->->Interactions Records
 */
function buildPublTree(pubSrcRcrds, data) {                                 //console.log("buildPublSrcTree. Tree = %O", pubRcrds);
    const pubRcrds = data.publication;
    const tree = {};
    const noPubl = [];
    pubSrcRcrds.forEach(function(pub) { addPubl(pub); });
    tree["Unspecified"] = getPubsWithoutPubls(noPubl);
    return tree;

    function addPubl(pub) {
        if (!pub.parent) { noPubl.push(pub); return; }
        const publ = _u.getDetachedRcrd(pub.parent, focusRcrds);
        tree[publ.displayName] = getPublData(publ); 
    }
    function getPublData(rcrd) {
        rcrd.children = getPublChildren(rcrd);
        return rcrd;
    }
    function getPublChildren(rcrd) {                                            //console.log("getPubChildren rcrd = %O", rcrd)
        if (rcrd.children.length === 0) { return []; }
        return rcrd.children.map(id => getPubData(
            _u.getDetachedRcrd(id, focusRcrds), pubRcrds));
    }
    function getPubsWithoutPubls(pubs) {
        const publ = { id: 0, displayName: "Unspecified", parent: null, 
            sourceType: { displayName: 'Publisher' }, interactions: [] };
        publ.children = pubs.map(pub => getPubData(pub, pubRcrds));
        return publ;
    }
} /* End buildPublTree */
/*-------------- Author Source Tree ------------------------------------------*/
/**
 * Returns a tree object with Authors as the base nodes of the data tree, 
 * with their contributibuted works and the interactions they contain nested 
 * within. Authors with no contributions are not added to the tree.
 * Data structure:
 * ->Author Display Name [Last, First M Suff]
 * ->->Citation Title (Publication Title)
 * ->->->Interactions Records
 */
function buildAuthTree(authSrcRcrds, data) {                                //console.log("----buildAuthSrcTree. authSrcRcrds = %O, pubRcrds", authSrcRcrds, pubRcrds);
    const pubRcrds = data.publication;
    const authRcrds = data.author;
    const tree = {};
    authSrcRcrds.forEach(rcrd => getAuthData(rcrd));
    return tree;  

    function getAuthData(authSrc) {                                             //console.log("rcrd = %O", authSrc);
        if (authSrc.contributions.length > 0) {
            authSrc.author = _u.getDetachedRcrd(authSrc.author, authRcrds);
            authSrc.children = getAuthChildren(authSrc.contributions); 
            tree[authSrc.displayName] = authSrc;
        }
    }
    /** For each source work contribution, gets any additional publication children
     *  and return's the source record.
     */
    function getAuthChildren(contribs) {                                        //console.log("getAuthChildren contribs = %O", contribs);
        return contribs.map(wrkSrcid => getPubData(
            _u.getDetachedRcrd(wrkSrcid, focusRcrds), pubRcrds));
    }
} /* End buildAuthTree */
/* ========================= TAXON TREE ============================================================================= */
/**
 * Returns a heirarchical tree of taxon record data from the top, parent, 
 * realm taxon through all children. The taxon levels present in the tree are 
 * stored in tblState.
 */
export function buildTxnTree(topTaxon, filtering, textFltr) {                   //console.log("buildTaxonTree called for topTaxon = %O. filtering? = %s. textFltr = ", topTaxon, filtering, textFltr);
    tblState = tState().get(null, ['rcrdsById', 'intSet']);
    focusRcrds = tblState.rcrdsById;

    let tree = buildTxnDataTree(topTaxon);
    tree = filterTreeByText(textFltr, tree);
    storeTaxonLevelData(topTaxon, filtering);
    return fillTreeWithInteractions('taxa', tree);  
}
function buildTxnDataTree(topTaxon) {
    let tree = {};                                                              //console.log("tree = %O", tree);
    tree[topTaxon.displayName] = topTaxon;  
    topTaxon.children = getChildTaxa(topTaxon.children);   
    tree = filterTreeToInteractionSet(tree, 'taxa');
    return tree;
    /**
     * Recurses through each taxon's 'children' property and returns a record 
     * for each child ID found. 
     */
    function getChildTaxa(children) {                                           //console.log("getChildTaxa called. children = %O", children);
        if (children === null) { return []; } //changed from nullifying the children prop to an empty array... consequences?
        return children.map(function(child){
            if (typeof child === "object") { return child; }

            const childRcrd = _u.getDetachedRcrd(child, focusRcrds);            //console.log("child = %O", childRcrd);
            if (childRcrd.children.length >= 1) { 
                childRcrd.children = getChildTaxa(childRcrd.children);
            } else { childRcrd.children = []; } //changed from nullifying the children prop to an empty array... consequences?

            return childRcrd;
        });
    }
} /* End buildTaxonTree */
function storeTaxonLevelData(topTaxon, filtering) {                             //console.log('storeTaxonLevelData. filtering?', filtering);
    _u.getData(['levelNames', 'realm']).then(data => { 
        if (!filtering) { storeLevelData(topTaxon, data); 
        } else { updateTaxaByLvl(topTaxon, data.levelNames); }
    });
}
/**
 * Stores in the global tblState obj:
 * > taxonByLvl - object with taxon records in the current tree organized by 
 *   level and keyed under their display name.
 * > allRealmLvls - array of all levels present in the current realm tree.
 */
function storeLevelData(topTaxon, data) {                                       //console.log('storeLevelData. topTaxon = %O', topTaxon)
    const taxaByLvl = seperateTaxonTreeByLvl(topTaxon, data.levelNames);                         
    const allRealmLvls = data.realm[topTaxon.realm.id].uiLevelsShown;           //console.log('taxaByLvl = %O, allRealmLvls = %O', _u.snapshot(taxaByLvl), _u.snapshot(allRealmLvls));
    tState().set({taxaByLvl: taxaByLvl, allRealmLvls: allRealmLvls});
}
function updateTaxaByLvl(topTaxon, levels) {
    const taxaByLvl = seperateTaxonTreeByLvl(topTaxon, levels);                 //console.log("taxaByLvl = %O", taxaByLvl)
    tState().set({'taxaByLvl': taxaByLvl});          
}
/** Returns an object with taxon records by level and keyed with display names. */
function seperateTaxonTreeByLvl(topTaxon, levels) {
    const separated = {};
    separate(topTaxon);
    return sortObjByLevelRank(separated);

    function separate(taxon) {                                                  //console.log('taxon = %O', taxon)
        const lvl = taxon.level.displayName;
        if (!separated[lvl]) { separated[lvl] = {}; }
        separated[lvl][taxon.displayName] = taxon.id;
        
        if (taxon.children) { 
            taxon.children.forEach(child => separate(child)); 
        }
    }
    function sortObjByLevelRank(taxonObj) {
        const obj = {};
        Object.keys(levels).forEach(lvl => {  
            if (lvl in taxonObj) { obj[lvl] = taxonObj[lvl]; }
        });
        return obj;
    }
} /* End seperateTaxonTreeByLvl */
/* ====================== Interaction Fill Methods ================================================================== */
/** Replaces all interaction ids with records for every node in the tree.  */
async function fillTreeWithInteractions(focus, dataTree) {                            //console.log('fillTreeWithInteractions. [%s], tree = %O', focus, dataTree);
    const fillInts = { taxa: fillTaxonTree, locs: fillLocTree, srcs: fillSrcTree };
    const entities = ['interaction', 'taxon', 'location', 'source'];
    const data = await _u.getData(entities);
    fillInts[focus](dataTree, data);
    return dataTree;
} 
function fillTaxonTree(dataTree, entityData) {                                  //console.log("fillingTaxonTree. dataTree = %O", dataTree);
    fillTaxaInteractions(dataTree);  

    function fillTaxaInteractions(treeLvl) {                                    //console.log("fillTaxonInteractions called. taxonTree = %O", dataTree) 
        for (let taxon in treeLvl) {   
            fillTaxonInteractions(treeLvl[taxon]);
            if (treeLvl[taxon].children !== null) { 
                fillTaxaInteractions(treeLvl[taxon].children); }
        }
    }
    function fillTaxonInteractions(taxon) {                                     //console.log("fillTaxonInteractions. taxon = %O", taxon);
        const roles = ['subjectRoles', 'objectRoles'];
        for (let r in roles) {
            taxon[roles[r]] = replaceInteractions(taxon[roles[r]], entityData); 
        }
    }
} /* End fillTaxonTree */
/**
 * Recurses through each location's 'children' property and replaces all 
 * interaction ids with the interaction records.
 */
function fillLocTree(branch, entityData) {                                      //console.log("fillLocTree called. taxonTree = %O", branch) 
    for (let node in branch) {                                                  //console.log("node = %O", branch[node]);
        if (branch[node].interactions.length > 0) { 
            branch[node].interactions = replaceInteractions(
                branch[node].interactions, entityData);
        }
        if (branch[node].children) { 
            fillLocTree(branch[node].children, entityData); }
    }
}
/**
 * Recurses through each source's 'children' property until finding the
 * direct source, then replacing its interaction id's with their records.
 */
function fillSrcTree(dataTree, entityData) { 
    for (let srcName in dataTree) {                                             //console.log("-----processing src %s = %O. children = %O", srcName, dataTree[srcName], dataTree[srcName].children);
        fillSrcInteractions(dataTree[srcName]);
    }
    /**
     * Recurses through each source's 'children' property until all sources 
     * have any interaction ids replaced with the interaction records. 
     */
    function fillSrcInteractions(curSrc) {                                      //console.log("fillSrcInteractions. curSrc = %O", curSrc);
        const srcChildren = [];
        if (curSrc.isDirect) { replaceSrcInts(curSrc); }
        curSrc.children.forEach(childSrc => fillSrcInteractions(childSrc));
    }
    function replaceSrcInts(curSrc) {  
        curSrc.interactions = replaceInteractions(curSrc.interactions, entityData); 
    }

} /* End fillSrcTree */
/** Replace the interaction ids with their interaction records. */
function replaceInteractions(interactionsAry, entityData) {                     //console.log("replaceInteractions called. interactionsAry = %O, intRcrds = %O", interactionsAry, entityData.interaction);
    return interactionsAry.map(function(intId){  
        if (typeof intId === "number") {                                        //console.log("new record = %O",  _u.snapshot(entityData.interaction[intId]));
            return fillIntRcrd(
                _u.getDetachedRcrd(intId, entityData.interaction), entityData); 
        } 
    });
}
/** Returns a filled record with all references replaced with entity records. */
function fillIntRcrd(intRcrd, entityData) {
    for (let prop in intRcrd) { 
        if (prop in entityData) { 
            intRcrd[prop] = entityData[prop][intRcrd[prop]];
        } else if (prop === "subject" || prop === "object") {
            intRcrd[prop] = entityData.taxon[intRcrd[prop]];
        } else if (prop === "tags") {
            intRcrd[prop] = intRcrd[prop].length > 0 ? 
                getIntTags(intRcrd[prop]) : null;
        }
    }
    return intRcrd;
}
function getIntTags(tagAry) { 
    const tags = tagAry.map(function(tag){ return tag.displayName; });
    return tags.join(", ");
}
/* ======================== FILTER BY TEXT ================================== */
function filterTreeByText(text, tree) {
    if (!text) { return tree; }
    const fltrd = {};

    for (let branch in tree) {
        const include = getRowsWithText(tree[branch], text);
        if (include) { fltrd[branch] = tree[branch]; }
    }

    return fltrd;
}
function getRowsWithText(branch, text) {                                        
    let hasText = branch.displayName.toLowerCase().includes(text.toLowerCase());//console.log('getRowsWithText hasText [%s] branch = %O', hasText, branch); 
    branch.children = branch.children.filter(c => getRowsWithText(c, text));
    branch.interactions = hasText ? branch.interactions : [];
    branch.failedFltr = !hasText;
    return hasText || branch.children.length > 0;
}
/* =================== FILTER BY INTERACTION SET ============================ */
function filterTreeToInteractionSet(dataTree, focus) {                          //console.log('filter[%s]TreeToInteractionSet. tree = %O  set = %O', focus, dataTree, tblState.intSet);
    const intSet = tblState.intSet;
    if (!intSet == null || !intSet) { return dataTree; }

    const tree = {};

    for (let bName in dataTree) {  
        addDataInInteractionSetToFilteredTree(dataTree[bName], bName);
    }                                                                           //console.log('tree after int filter = %O', tree)
    return tree;

    function addDataInInteractionSetToFilteredTree(branch, name) {
        const hasIntsInSet = filterEntityAndSubs(branch, focus, intSet); 
        if (hasIntsInSet) { tree[name] = branch; }
    }
} /* End filterTreeToInteractionSet */
function filterEntityAndSubs(ent, focus, set) {                                 //console.log('filterEntityAndSubs. Entity = %O', ent);
    if (ent.children) { filterEntsInSubs(); }
    const inSet = hasInteractionsInSet();                                       //if (inSet) { console.log('inSet! entity = %O', ent) }
    return inSet || ent.children.length;

    function filterEntsInSubs() {
        ent.children = ent.children.filter(c => filterEntityAndSubs(c, focus, set)); 
    }
    function hasInteractionsInSet() {
        return focus === 'taxa' ? filterTaxonInteractions() :
            focus === 'locs' ? filterLocInterations() : 
            filterEntityInteractions();
    }
    function filterEntityInteractions(p) {                                   
        const prop = p ? p : 'interactions';                                    //console.log('filterEntityInteractions. [%s] ent = %O, set = %O', prop, ent, set);
        ent[prop] = ent[prop].filter(id => set.indexOf(id) !== -1);
        return ent[prop].length > 0;                                  
    }
    function filterTaxonInteractions() {
        const obj = filterEntityInteractions('objectRoles');
        const subj = filterEntityInteractions('subjectRoles');
        return obj || subj;
    }
    function filterLocInterations() {
        const hasInts = filterEntityInteractions();
        ent.totalInts = updateLocationTotalIntCount(0, ent);
        return hasInts;
    }
    /**
     * The totalInt count is used when displaying interactions focused on location
     * in "Map Data" view.
     */
    function updateLocationTotalIntCount(total, locEnt) {                       //console.log('updateLocationTotalIntCount. ttl = %s, locEnt = %O', total, JSON.parse(JSON.stringify(locEnt)));
        let cnt = 0;
        cnt += locEnt.interactions.length;
        if (locEnt.children.length > 0) { 
            cnt += locEnt.children.reduce(updateLocationTotalIntCount, 0); 
        }
        locEnt.totalInts = cnt;
        return total + cnt;
    }
} /* End filterEntityAndSubs */
/* ================================ UTILITY ========================================================================= */
/** Sorts the all levels of the data tree alphabetically. */
function sortDataTree(tree) {
    const sortedTree = {};
    const keys = Object.keys(tree).sort(alphaBranchNames);    

    for (var i=0; i<keys.length; i++){ 
        sortedTree[keys[i]] = sortNodeChildren(tree[keys[i]]);
    }
    return sortedTree;

    function sortNodeChildren(node) { 
        if (node.children) {  
            node.children = node.children.sort(alphaEntityNames);
            node.children.forEach(sortNodeChildren);
        }
        return node;
    } 
    function alphaBranchNames(a, b) {
        if (a.includes('Unspecified')) { return 1; }
        var x = a.toLowerCase();
        var y = b.toLowerCase();
        return x<y ? -1 : x>y ? 1 : 0;
    }
} /* End sortDataTree */
/** Alphabetizes array via sort method. */
function alphaEntityNames(a, b) {                                               //console.log("alphaSrcNames a = %O b = %O", a, b);
    var x = a.displayName.toLowerCase();
    var y = b.displayName.toLowerCase();
    return x<y ? -1 : x>y ? 1 : 0;
}