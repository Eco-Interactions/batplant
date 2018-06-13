/** 
 * This file is responsible for interactions with the google maps API.
 * Displays the map on the search database page.
 */
/**
 * Exports:
 *   initMap
 *   showLoc
 *   updateGeoJsonData
 */
import * as idb from 'idb-keyval'; //set, get, del, clear
import * as _util from '../misc/util.js';
import * as db_page from './db-page.js';
import 'leaflet.markercluster';

let geoJson, locations, map, showMap, popups = {};
const dataKey = 'Live for justice!!!!!! <3<3';

initDb();
requireCss();
fixLeafletBug();

/** =================== Init Methods ======================================== */
function requireCss() {
    require('../../../node_modules/leaflet/dist/leaflet.css');
    require('../../../node_modules/leaflet.markercluster/dist/MarkerCluster.css');
    require('../../../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css');
}
/** For more information on this fix: github.com/PaulLeCam/react-leaflet/issues/255 */
function fixLeafletBug() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
}
/** ------------------ Stored Data Methods ---------------------------------- */
/**
 * Checks whether the dataKey exists in indexDB cache. 
 * If it is, the stored geoJson is fetched and stored in the global variable. 
 * If not, the db is cleared and geoJson is redownloaded. 
 */
function initDb() {
    idb.get(dataKey).then(clearIdbCheck);
}
function clearIdbCheck(storedKey) {                                             console.log('clearing Idb? ', storedKey === undefined);
    if (storedKey) { return getGeoJsonData(); } 
    idb.clear();                                                                //console.log('actually clearing');
    downloadGeoJson();
}
function getGeoJsonData() {                                                     //console.log('getGeoJsonData')
    idb.get('geoJson').then(storeGeoJson);
}
function storeGeoJson(geoData) {                                                //console.log('storeGeoJson. geoData ? ', geoData !== undefined);
    if (geoData === undefined) { return downloadGeoJson(); }
    geoJson = geoData; 
    if (showMap) { initMap(); }
}
function downloadGeoJson() {                                                    //console.log('downloading all geoJson data!');
    _util.sendAjaxQuery({}, 'ajax/geo-json', storeServerGeoJson);                     
}
function storeServerGeoJson(data) {                                             console.log('server geoJson = %O', data.geoJson);
    idb.set('geoJson', data.geoJson);
    storeGeoJson(data.geoJson);
    idb.set(dataKey, true);
}
/**
 * Loops through the passed data object to parse the nested objects. This is 
 * because the data comes back from the server having been double JSON-encoded,
 * due to the 'serialize' library and the JSONResponse object. 
 */
function parseData(data) {
    for (var id in data) { data[id] = JSON.parse(data[id]); } 
    return data;
}
export function updateGeoJsonData(argument) { //TODO: When db_sync checks for entity updates, send geoJson updates here
    // body...
}
/** ======================= Show Loc on Map ================================= */
/** Centers the map on the location and zooms according to type of location. */
export function showLoc(id, zoom) {                                             
    const loc = locations[id];                                                  console.log('show loc = %O, zoom = %s', loc, zoom)
    const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId, noGeoDataErr);       //console.log('point = %s', point);
    const popup = popups[loc.displayName] || buildLocPopup(loc, latLng);
    popup.setContent(getLocationSummaryHtml(loc, null));  
    popup.options.autoClose = false;
    map.openPopup(popup); 
    map.setView(latLng, zoom, {animate: true});  

    function noGeoDataErr() {
        // const geoData = JSON.parse(geoJson[id]);                                console.log('geoData = %O', geoData);
        console.log('###### No geoJson found for geoJson [%s] ###########', id);
    }
}
function buildLocPopup(loc, latLng) {  
    const popup = L.popup().setLatLng(latLng).setContent('');
    popups[loc.displayName] = popup;  
    return popup;
}
/** ======================= Init Map ======================================== */
/** Initializes the search database map using leaflet and mapbox. */
export function initMap() {                                                     console.log('attempting to initMap')
    if (!geoJson) { showMap = true; return }                                    console.log('  initializing');
    map = L.map('map');
    map.setMaxBounds(getMapBounds());
    map.on('click', logLatLng);
    map.on('load', addInteractionMarkersToMap);
    addMapTiles();
    map.setView([22,22], 2)
    
} /* End initMap */
function logLatLng(e) {
    console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
}
function getMapBounds() {
    const southWest = L.latLng(-100, 200);
    const northEast = L.latLng(100, -200);
    return L.latLngBounds(southWest, northEast);
}
function addMapTiles() {
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        minZoom: 3, //Don't zoom out passed 
        maxZoom: 16,
        id: 'mapbox.run-bike-hike',
        accessToken: 'pk.eyJ1IjoiYmF0cGxhbnQiLCJhIjoiY2poNmw5ZGVsMDAxZzJ4cnpxY3V0bGprYSJ9.pbszY5VsvzGjHeNMx0Jokw'
    }).addTo(map);
}
/** ================= Map Marker Methods ==================================== */
/**
 * Adds a marker to the map for each interaction with any location data. Each 
 * marker has a popup with either the location name and the country, just the  
 * country or region name. Locations without gps data are added to markers at  
 * the country level with "Unspecified" as the location name. Inside the popups
 * is a "Location" button that will replace the name popup with a 
 * summary of the interactions at the location.
 */
function addInteractionMarkersToMap() {
    locations = _util.getDataFromStorage('location');
    const regions = getRegionLocs();
    for (let id in regions) { addMarkersForRegion(regions[id]) }; 

    function getRegionLocs() {
        const regionIds = _util.getDataFromStorage('topRegionNames');
        return Object.values(regionIds).map(id => locations[id]);
    }
    function addMarkersForRegion(region) {
        if (region.displayName === "Unspecified") { return; }
        addMarkersForLocAndChildren(region);
    }
    /** 
     * intCnt - Total interactions for loc and all sub-locs without GPS data. 
     * subCnt - Number of sub-locs that need GPS data in order to display on map.
     */
    function addMarkersForLocAndChildren(loc) {                                 
        if (!loc.totalInts) { return; }                                         //console.log('addMarkersForLocAndChildren for [%s] = %O', loc.displayName, loc);
        let intCnt = loc.interactions.length; 
        let subCnt = 0;
        buildMarkersForLocChildren(loc.children);                               
        if (intCnt || subCnt) { buildLocationMarkers(intCnt, subCnt, loc); }

        function buildMarkersForLocChildren(locs) {
            locs.forEach(id => {
                let loc = locations[id];
                if (loc.locationType.displayName == 'Country') { 
                    return addMarkersForLocAndChildren(loc, false); 
                }
                buildLocationIntMarkers(loc, loc.interactions.length);
            });
        }
        function buildLocationIntMarkers(loc, locIntCnt) {                      //console.log('buildLocationIntMarkers for [%s]', loc.displayName, loc);
            if (loc.children.length) { return addMarkersForLocAndChildren(loc); }
            if (!locIntCnt) { return; }
            buildLocationMarkers(locIntCnt, null, loc);
        }
        function buildLocationMarkers(intCnt, subCnt, loc) {                    //console.log('   buildLocationMarkers for [%s] = %O', loc.displayName, loc);
            const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId, logNoGeoJsonError);       //console.log('        latLng = ', latLng)
            if (!latLng) { return; }
            addMarkerForEachInteraction(intCnt, subCnt, latLng, loc);
        }
        function logNoGeoJsonError() {
            if (!loc.interactions.length) { return null; }
            intCnt += loc.interactions.length;
            ++subCnt;
            // console.log('###### No geoJson for [%s] %O', loc.displayName, loc)
        }
    } /* End addMarkersForLocAndChildren */
} /* End addInteractionMarkersToMap */
function getCenterCoordsOfLoc(loc, geoJsonId, noGeoDataErrFunc) { 
    if (!geoJsonId) { return noGeoDataErrFunc(); }                              //console.log('geoJson obj = %O', geoJson[geoJsonId]);
    const locGeoJson = JSON.parse(geoJson[geoJsonId]);                          //console.log('        locGeoJson = %O', locGeoJson);
    return locGeoJson.centerPoint ? 
        formatPoint(locGeoJson.centerPoint) 
        : getLocCenterPoint(loc, locGeoJson);

} /* End getCenterCoordsOfLoc */
/** Return a leaflet LatLng object from the GeoJSON Long, Lat point */
function formatPoint(point) {                                                   //console.log('point = ', point)
    let array = JSON.parse(point); 
    return L.latLng(array[1], array[0]);
}
function getLocCenterPoint(loc, locGeoJson) {
    const feature = buildFeature(loc, locGeoJson);
    const polygon = L.geoJson(feature);//.addTo(map);
    console.log('### New Center Coordinates ### "%s" => ', loc.displayName, polygon.getBounds().getCenter());
    return polygon.getBounds().getCenter(); 
} /* End getLocCenterPoint */
function buildFeature(loc, geoData) {                                           //console.log('place geoData = %O', geoData);
    return {
            "type": "Feature",
            "geometry": {
                "type": geoData.type,
                "coordinates": JSON.parse(geoData.coordinates)
            },
            "properties": {
                "name": loc.displayName
            }
        };   
}
function addMarkerForEachInteraction(intCnt, subCnt, latLng, loc) {             //console.log('       adding [%s] markers at [%O]', intCnt, latLng);
    return intCnt === 1 ? addMarker() : addCluster();

    function addMarker() {
        map.addLayer(addSingleMarker(subCnt, latLng, loc));
    }
    function addCluster() {
        let cluster = L.markerClusterGroup();
        for (let i = 0; i < intCnt; i++) {  
            cluster.addLayer(L.marker(latLng)); 
        }
        addPopupToCluster(subCnt, cluster, loc, latLng);
        map.addLayer(cluster);
    }
} /* End addMarkerForEachInteraction */
/** ----------------- Marker/Popup Methods ---------------------------------- */
function addSingleMarker(subCnt, latLng, loc) {                                 //Refactor into class Marker
    let timeout;
    const marker = L.marker(latLng)
        .bindPopup(getLocNamePopupHtml(loc, buildLocSummaryPopup))
        .on('mouseover', openPopup)
        .on('click', openPopupAndDelayAutoClose)
        .on('mouseout', delayPopupClose);  
    const popup = marker.getPopup().setLatLng(latLng);
    popups[loc.displayName] = popup;  
    return marker;
    /**
     * Replaces original popup with more details on the interactions at this
     * location. Popup will remain open until manually closed, when the original
     * location name popup will be restored. 
     */
    function buildLocSummaryPopup() {                                           //console.log('building loc summary')
        clearMarkerTimeout(timeout);
        updateMouseout(Function.prototype);
        popup.setContent(getLocationSummaryHtml(loc, subCnt));
        popup.options.autoClose = false;
        marker.on('popupclose', restoreLocNamePopup);
        marker.openPopup(popup);
    }
    function restoreLocNamePopup() {                                            //console.log('restoring original popup');
        window.setTimeout(restoreOrgnlPopup, 400);
        /** Event fires before popup is fully closed. Restores after closed. */
        function restoreOrgnlPopup() {
            updateMouseout(delayPopupClose);
            popup.setContent(getLocNamePopupHtml(loc, buildLocSummaryPopup));
            popup.options.autoClose = true;
            marker.off('popupclose');
        }
    } /* End restoreLocNamePopup */
    /** --- Event Handlers --- */
    function openPopup(e) {
        if (timeout) { clearMarkerTimeout(timeout); }
        marker.openPopup();
    }
    /** 
     * Delays auto-close of popup if a nearby marker popup is opened while trying
     * to click the location summary button. 
     */
    function openPopupAndDelayAutoClose(e) {
        openPopup();
        popup.options.autoClose = false;
        window.setTimeout(() => popup.options.autoClose = true, 700);
    }
    function delayPopupClose(e) {
        const popup = this;
        timeout = window.setTimeout(() => popup.closePopup(), 700);
    }
    function updateMouseout(func) {
        marker.off('mouseout').on('mouseout', func);
    }
} /* End addSingleMarker */
function addPopupToCluster(subCnt, cluster, loc, latLng) {                      
    let timeout, popup;
    addClusterEvents();
    buildPopup();

    function addClusterEvents() { 
        cluster.on('clustermouseover', openClusterPopup)
            .on('clustermouseout', delayClusterPopupClose)
            .on('clusterclick', openPopupAndDelayAutoClose); 
    }    
    function removeClusterEvents() {
        cluster.off('clustermouseover').off('clustermouseout').off('clusterclick'); 
    }
    function buildPopup() {
        popup = L.popup()
            .setLatLng(latLng)
            .setContent(getLocNamePopupHtml(loc, buildSummaryPopup))
        popups[loc.displayName] = popup;
    }
    function openClusterPopup(c) {
        if (timeout) { clearTimeout(timeout); timeout = null; }  
        map.openPopup(popup);
    }
    function buildSummaryPopup() {                                              //console.log('building cluster loc summary')
        clearMarkerTimeout(timeout);
        updateMouseout(Function.prototype);
        popup.setContent(getLocationSummaryHtml(loc, subCnt));
        popup.options.autoClose = false;
        map.on('popupclose', closeLayerPopup);
        removeClusterEvents();
        map.openPopup(popup);
    }
    /** Event fires before popup is fully closed. Restores after closed. */
    function closeLayerPopup(e) {
        if (e.popup._latlng === latLng) {
            window.setTimeout(restoreOrgnlPopup, 400);
        }
    }
    function restoreOrgnlPopup() {
        updateMouseout(delayClusterPopupClose);
        popup.setContent(getLocNamePopupHtml(loc, buildSummaryPopup));
        popup.options.autoClose = true;
        cluster.off('clusterpopupclose');
        addClusterEvents();
    }
    function delayClusterPopupClose(e) {
        timeout = window.setTimeout(() => map.closePopup(), 700);
    }
    function openPopupAndDelayAutoClose(c) {
        c.layer.unspiderfy(); //Prevents the 'spiderfy' animation for contained markers
        openClusterPopup(c);
        popup.options.autoClose = false;
        window.setTimeout(() => popup.options.autoClose = true, 400);
    }
    function updateMouseout(func) {
        cluster.off('clustermouseout').on('clustermouseout', func);
    }
}  /* End addPopupToCluster */
/** ---------------- Marker/Popup Helpers ------------------------ */
/**
 * Builds the popup for each marker that shows location and region name. Adds a 
 * "Location Summary" button to the popup connected to @showLocDetailsPopup.
 */
function getLocNamePopupHtml(loc, summaryFunc) {
        const div = _util.buildElem('div');
        const text = getLocNameHtml(loc);
        const bttn = buildLocSummaryBttn(summaryFunc);
        $(div).append(text).append(bttn);
        return div;
}
function getLocNameHtml(loc) {  
    let parent = loc.locationType.displayName === 'Country' ? '' :
        loc.country ? loc.country.displayName : 'Region';
    const locName = loc.displayName;
    return '<div style="font-size:1.2em;"><b>' + locName + 
        '</b></div><div style="margin: 0 0 .5em 0;">'+parent+'</div>';
} 
function clearMarkerTimeout(timeout) {
    clearTimeout(timeout); 
    timeout = null;                                                             //console.log('timout cleared')       
}
/** ------- Location Summary Popup ------------- */
function buildLocSummaryBttn(showSummaryFunc) {
    const bttn = _util.buildElem('input', {type: 'button',
        class:'ag-fresh grid-bttn', value: 'Location Summary'});
    $(bttn).click(showSummaryFunc);
    $(bttn).css({'margin': '.5em 0 0 0'});
    return bttn;
}
/** Returns additional details (html) for interactions at the location. */
function getLocationSummaryHtml(loc, subCnt) {                                  console.log('loc = %O', loc);
    const div = _util.buildElem('div');
    const html = buildLocDetailsHtml(loc, subCnt);
    const bttn = buildToGridButton(loc);
    $(div).append(html).append(bttn);
    return div;
}
function buildLocDetailsHtml(loc, subCnt) {
    const name = getLocNameHtml(loc);
    const cnt = ifCountryGetIntCnt(loc);
    const subs = getSubLocsWithoutGpsData(subCnt);
    const coords = getCoordsHtml(loc);
    const habType = getHabTypeHtml(loc);
    const bats = getBatsCitedHtml(loc);  
    return name + [cnt, subs, coords, habType, bats].filter(el => el).join('<br>');  
}
function isRegionOrCountry(loc) {
    const locType = loc.locationType.displayName;  
    return ['Region', 'Country'].indexOf(locType) !== -1;
}
function ifCountryGetIntCnt(loc) {
    const locType = loc.locationType.displayName;
    return ['Region', 'Country'].indexOf(locType) === -1 ? false : 
        `Interactions in ${locType}: <b> ${loc.totalInts}</b>`;
}
function getSubLocsWithoutGpsData(cnt) {
    if (!cnt) { return false; }
    return `Sub-Locations without GPS data: ${cnt}<br>`; 
}
function getCoordsHtml(loc) {
    const geoData = JSON.parse(geoJson[loc.geoJsonId]);                         //console.log('geoJson = %O', geoData); 
    if (geoData.type !== 'point' || isRegionOrCountry(loc)) { return false; }
    let coords = JSON.parse(geoData.coordinates)
    coords = coords.map(c => Number(c).toFixed(6)); 
    return 'Coordinates: <b>' + coords.join(', ') +'</b>';
}
/** --- Habitat Types --- */
/** Build string of 3 most reported habitats and the count of remaining reported. */
function getHabTypeHtml(loc) {
    if (isRegionOrCountry(loc)) { return getAllHabitatsWithin(loc); }
    if (!loc.habitatType) { return 'Habitat Type:'; }
    return `Habitat: <b>${loc.habitatType.displayName}</b>`;
}
function getAllHabitatsWithin(loc) {                                            //console.log('getting habitats for = %O', loc);
    const habitats = {};
    addHabitatsForLocAndChildren(loc.id);
    return Object.keys(habitats).length ? buildHabHtml() : ''; 

    function addHabitatsForLocAndChildren(id) { 
        let loc = locations[id]; 
        if (loc.interactions.length) { addLocHabitat(loc); }
        if (loc.children.length) { loc.children.forEach(addHabitatsForLocAndChildren); }        
    }
    function addLocHabitat(loc) {
        if (!loc.habitatType) { return; }
        const name = loc.habitatType.displayName;
        if (!habitats[name]) { habitats[name] = 0; }
        ++habitats[name];
    }
    function buildHabHtml() {  console.log('habitats = %O', habitats);
        const str = getTopThreeReportStr(habitats);  console.log
        return `Habitats: <b>&ensp; ${str}</b>`;
    }
}
/** --- Cited Bats --- */
/** Build string of 3 most reported taxonyms and the count of remaining taxa reported. */
function getBatsCitedHtml(loc) {    
    const rcrds = _util.getDataFromStorage(['interaction', 'taxon']);
    const allBats = {};
    getAllBatsWithin(loc.id);
    const bats = getTopThreeReportStr(allBats);
    return `Cited bats: <b>${bats}</b>`;
    
    function getAllBatsWithin(id) {  console.log('getAllBatsWithin = ', id)
        const loc = locations[id];
        if (loc.interactions.length) { addBats(loc.interactions); }
        if (loc.children.length) { loc.children.forEach(getAllBatsWithin); }
    }
    function addBats(interactions) {
        const ints = interactions.map(id => rcrds.interaction[id]);
        ints.forEach(int => trackBatInteraction(int, rcrds.taxon, allBats));
    }
} /* End getBatsCitedHtml */
function trackBatInteraction(int, rcrds, allBats) {
    let bat = rcrds[int.subject];                                               //console.log('bat = %O', bat);
    let name = buildBatName(bat);
    if (Object.keys(allBats).indexOf(name) === -1) { allBats[name] = 0; }
    ++allBats[name];
}
function buildBatName(bat) {
    let name = '';
    if (bat.level.displayName !== 'Species') { name += bat.level.displayName + ' '; }
    return name + bat.displayName;
}
/** ---- Habitat and Bat Helper ---- */
/**
 * Sorts an object with unique name keys and values with the number of time this
 * item was present in the cited records (habitats in locs or bats in interactions). 
 * Returns a string with the three names with the highest count, and a total of 
 * all items (habitats/bats) counted.
 */
function getTopThreeReportStr(obj) {
    const ttl = Object.keys(obj).length;                                       
    const sorted = { 1: [], 2: [], 3: [] };
    const posKeys = Object.keys(sorted);
    for (let name in obj) {
        sortItem(obj[name], name);
    }                                                                           //console.log('sorted habs = %O', sorted)
    return buildReportString(obj, sorted, ttl);

    function sortItem(count, name) {                                             
        posKeys.some((pos) => {
            if (count > sorted[pos][0] || !sorted[pos][0]) {                    
                replacePosition(count, name, pos); 
                return true;
            }
        });
    }
    function replacePosition(count, name, pos) {
        if (pos > ttl || !sorted[pos]) { return; }
        replacePosition(sorted[pos][0], sorted[pos][1], Number(pos) + 1);
        sorted[pos] = [ count, name ];
    }
} /* End getReportString */
/** Returns string with the names of top 3 reported taxa and total taxa count. */
function buildReportString(obj, sorted, ttl) {
    return ttl == 1 ? sorted[1][1] : formatString();

    function formatString() {
        const tabs = '&emsp;&emsp;&emsp;&emsp;&emsp;';
        let str = '';
        concatNames();
        return finishReportString();

        function concatNames() {
            for (let i = 1; i <= 3; i++) {
                str += i === 1 ? sorted[i][1] : //+ ` </b>(${sorted[i][0]})<b>`
                    !sorted[i].length ? '' : ',<br>' + tabs + sorted[i][1];
            }
        }
        function finishReportString() {
            if (ttl > 3) { str += ',<br></b>' + tabs + '(' + ttl + ' total cited here.)'}
            return str;
        } 
    }
}
/** --- Button to show interactions in the data-grid --- */
function buildToGridButton(loc) {
    const bttn = _util.buildElem('input', {type: 'button',
        class:'ag-fresh grid-bttn', value: 'Show Interactions In Data-Grid'});
    $(bttn).click(showLocGridView.bind(null, loc));
    $(bttn).css({'margin': '.5em 0 0 -.4em'});
    return bttn;
}
function showLocGridView(loc) {
    console.log('Switch to grid view and show location.');
    db_page.showLocInDataGrid(loc);
}
