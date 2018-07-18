/** 
 * This file is responsible for interactions with the google maps API.
 * Displays the map on the search database page.
 */
/**
 * Exports:
 *   initMap
 *   showLoc
 */
import * as _util from '../misc/util.js';
import * as db_page from './db-page.js';
import { MapMarker, MapCluster } from './map-markers.js'; 
import 'leaflet.markercluster';

let locRcrds, map, popups = {};

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
    _util.initGeoJsonData();
}
function geoJsonDataAvailable() {
    return _util.isGeoJsonDataAvailable();
}
/** ======================= Show Loc on Map ================================= */
/** Centers the map on the location and zooms according to type of location. */
export function showLoc(id, zoom) {                                             
    const loc = locations[id];                                                  console.log('show loc = %O, zoom = %s', loc, zoom)
    const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId);                    //console.log('point = %s', point);
    if (!latLng) { return noGeoDataErr(); }
    const popup = popups[loc.displayName] || buildLocPopup(loc, latLng);
    popup.setContent(getLocationSummaryHtml(loc, null));  
    popup.options.autoClose = false;
    map.openPopup(popup); 
    map.setView(latLng, zoom, {animate: true});  

    function noGeoDataErr() {
        // const geoData = JSON.parse(geoJson[id]);                             console.log('geoData = %O', geoData);
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
export function initMap() {                                                     console.log('attempting to initMap')
    waitForStorageAndLoadMap();                                                 
}
function waitForStorageAndLoadMap() {
    return geoJsonDataAvailable() ? 
    buildAndShowMap(addAllIntMrkrsToMap) : 
    window.setTimeout(waitForStorageAndLoadMap, 500);
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
    function addMarkersForLocAndChildren(topLoc) {                                 
        if (!topLoc.totalInts) { return; }                                      //console.log('addMarkersForLocAndChildren for [%s] = %O', loc.displayName, loc);
        let intCnt = topLoc.interactions.length; 
        let subCnt = 0;
        buildMarkersForLocChildren(topLoc.children);                               
        if (intCnt || subCnt) { buildLocationMarkers(intCnt, subCnt, topLoc); }

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
            const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId);            //console.log('        latLng = ', latLng)
            if (!latLng) { return logNoGeoJsonError(loc); }
            addMarkerForEachInteraction(intCnt, subCnt, latLng, loc);
        }
        function logNoGeoJsonError(loc) {
            if (!loc.interactions.length) { return null; }
            intCnt += loc.interactions.length;  
            if (locIsHabitatOfTopLoc(loc)) { return; }
            ++subCnt;
            // console.log('###### No geoJson for [%s] %O', loc.displayName, loc)
        }
        function locIsHabitatOfTopLoc(loc) {
            const subName = loc.displayName.split('-')[0];
            const topName = topLoc.displayName;  
            return topName.indexOf(subName) !== -1;
        }
    } /* End addMarkersForLocAndChildren */
} /* End addInteractionMarkersToMap */
function getCenterCoordsOfLoc(loc, geoJsonId) { 
    if (!geoJsonId) { return false; }                                           //console.log('geoJson obj = %O', geoJson[geoJsonId]);
    const locGeoJson = _util.getGeoJsonEntity(geoJsonId);
    return locGeoJson.centerPoint ? 
        formatPoint(locGeoJson.centerPoint) 
        : getLocCenterPoint(loc, locGeoJson);
} 
/** Return a leaflet LatLng object from the GeoJSON Long, Lat point */
function formatPoint(point) {                                                   //console.log('point = ', point)
    let array = JSON.parse(point); 
    return L.latLng(array[1], array[0]);
}
function getLocCenterPoint(loc, locGeoJson) {
    const feature = buildFeature(loc, locGeoJson);
    const polygon = L.geoJson(feature);
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
        let Marker = new MapMarker(subCnt, latLng, loc, locRcrds);
        popups[loc.displayName] = Marker.popup;  
        map.addLayer(Marker.layer);
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
    const pLocData = (cnt||subs) ? [cnt, subs].filter(el=>el).join('<br>')+'<br>' : false;
    const coords = getCoordsHtml(loc);
    const habType = getHabTypeHtml(loc);
    const bats = getBatsCitedHtml(loc);  
    return name + [pLocData, coords, habType, bats].filter(el => el).join('<br>');  
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
    return `Sub-Locations without GPS data: ${cnt}`; 
}
function getCoordsHtml(loc) {
    const geoData = _util.getGeoJsonEntity(loc.geoJsonId);                      //console.log('geoJson = %O', geoData); 
    if (geoData.type !== 'Point' || isRegionOrCountry(loc)) { return false; }
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
    return Object.keys(habitats).length ? buildHabHtml() : 'Habitat Types:'; 

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
    
    function getAllBatsWithin(id) {  
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
/* --- Grid Popup --- */
function showPopUpMsg(msg) {                                                    //console.log("showPopUpMsg. msg = ", msg)
    const popUpMsg = msg || 'Loading...';
    $('#grid-popup').text(popUpMsg);
    $('#grid-popup').addClass('loading'); //used in testing
    $('#grid-popup, #grid-overlay').show();
    fadeGrid();
}
function hidePopUpMsg() {
    $('#grid-popup, #grid-overlay').hide();
    $('#grid-popup').removeClass('loading'); //used in testing
    showGrid();
}
function fadeGrid() {
    $('#borderLayout_eRootPanel, #grid-tools, #grid-opts').fadeTo(100, .3);
}
function showGrid() {
    $('#borderLayout_eRootPanel, #grid-tools, #grid-opts').fadeTo(100, 1);
}