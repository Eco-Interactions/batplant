/**
 * Entry point for all local data-storage methods.
 *
 * EXPORT:
 *     fetchData
 *
 *
 * TOC:
 *     FACADE
 *         IDB
 *         DATA SYNC
 *         DATA INIT
 *     DATA UTIL
 */
import { _modal, alertIssue, showIntroAndLoadingMsg } from '../db-main.js';
import * as idb from './idb-util.js';
import * as sync from './db-sync.js';
import * as temp from './temp-data.js';
import * as init from './init-data.js';

/* ========================== FACADE ======================================== */
export function initDb(argument) {
    idb.initDb();
}
export function setData(prop, data) {
    idb.setData(prop, data);
}
export function getData(props, returnUndefined) {
    return idb.getData(props, returnUndefined);
}
/* -------------------------- DATA SYNC ------------------------------------- */
export function updateLocalDb(data) {
    return sync.updateLocalDb(data);
}
export function updateUserNamedList() {
    return sync.updateUserNamedList(...arguments);
}
/* -------------------------- DATA INIT ------------------------------------- */
export function resetStoredData(reset) {
    idb.downloadFullDb(reset);
}
export function resetLocalDb() {
    const confg = {
        html: '<center>Click "Reset" to redownload all data.</center>',
        elem: '#data-help', dir: 'left', submit: resetDb, bttn: 'Reset'
    }
    _modal('showSaveModal', [confg]);

    function resetDb() {
        _modal('exitModal');
        idb.downloadFullDb(true);
    }
}
/* ================ LOCAL-DATA INTERNAL FACADE ============================== */
export function fetchServerData(url, options = {}, n = 9) {                     console.log('       *-fetchServerData [%s] with params = %O', url, Object.keys(options).length ? options : null);
    return fetch('fetch/'+url, options).then(response => {
        if (!!response.ok) { return response.json(); }
        if (n === 1) { return alertFetchIssue(url, response.json()); }
        return fetchServerData(url, options, n - 1);
    });
};
function alertFetchIssue(url, responseText) {
    alertIssue('fetchIssue', { url: url, response: responseText });
    return Promise.reject();
}
export function getAllStoredData() {
    return idb.getAllStoredData();
}
/* -------------------------- DATA SYNC ------------------------------------- */
export function syncLocalDbWithServer(lclDataUpdatedAt) {
    sync.syncLocalDbWithServer(lclDataUpdatedAt);
}
/* -------------------------- DATA INIT ------------------------------------- */
/**
 * The first time a browser visits the search page all entity data is downloaded
 * from the server and stored locally @initLocalData. A data-loading popup message
 * and intro-walkthrough are shown on the Search page.
 */
export function initStoredData(reset) {
    showIntroAndLoadingMsg(reset);
    return require('./init-data.js').default(reset);
}
export function deriveUserData() {
    return init.deriveUserData(...arguments);
}
/** ------------------- DATA IN MEMORY -------------------------------------- */
export function getMmryData() {
    return temp.getMmryData(...arguments);
}
export function setDataInMemory() {
    temp.setDataInMemory(...arguments);
}
export function setUpdatedDataInLocalDb() {
    return temp.setUpdatedDataInLocalDb();
}
export function setMmryDataObj() {
    return temp.setMmryDataObj(...arguments);
}
export function deleteMmryData() {
    return temp.deleteMmryData(...arguments);
}
export function clearTempMmry() {
    return temp.clearTempMmry();
}