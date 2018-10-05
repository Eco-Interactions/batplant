/** 
 * This file is responsible for interactions with the google maps API.
 * Displays the map on the search database page.
 */
/**
 * Exports:
 *   initMap
 *   showLoc
 *   showInts
 */
import * as _u from './util.js';
import * as db_page from './db-page.js';
import * as db_forms from './db-forms.js';
import * as MM from './map-markers.js'; 
import { jsonp } from '../../../node_modules/leaflet-control-geocoder/src/util.js';

let locRcrds, map, geoCoder, poly, volatilePin, popups = {};

initDb();
requireCss();
fixLeafletBug();

/** =================== Init Methods ======================================== */
function requireCss() {
    require('../../../node_modules/leaflet/dist/leaflet.css');
    require('../../../node_modules/leaflet.markercluster/dist/MarkerCluster.css');
    require('../../../node_modules/leaflet.markercluster/dist/MarkerCluster.css');
    require('../../../node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css');
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
    _u.initGeoJsonData();
}
function geoJsonDataAvailable() {
    return _u.isGeoJsonDataAvailable();
}
/*=========================== Shared Methods =================================*/
// Test for when geoJsonData is erroring and then redownload the data
function waitForDataThenContinue(cb) {                                          console.log('waiting for geojson');
    return geoJsonDataAvailable() ? cb() : 
        window.setTimeout(waitForDataThenContinue.bind(null, cb), 500);
}
/** Initializes the map using leaflet and mapbox. */
function buildAndShowMap(loadFunc, mapId) {                                     console.log('buildAndShowMap. loadFunc = %O mapId = %s', loadFunc, mapId);
    map = getMapInstance(mapId);
    map.setMaxBounds(getMapBounds());
    map.on('click', logLatLng);
    map.on('load', loadFunc);
    addMapTiles(mapId);
    addGeoCoderToMap();
    addTipsLegend();
    if (mapId !== 'loc-map') { buildSrchPgMap(); }
    map.setView([22,22], 2);                                                    console.log('map built.')
}
function getMapInstance(mapId) {
    if (map) { map.remove(); }
    popups = {};
    return L.map(mapId); 
}
function logLatLng(e) {
    console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
}
function getMapBounds() {
    const southWest = L.latLng(-100, 200);
    const northEast = L.latLng(100, -200);
    return L.latLngBounds(southWest, northEast);
}
function addMapTiles(mapId) {
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        minZoom: mapId === 'loc-map' ? 1 : 3, //Don't zoom out passed 
        maxZoom: 16,
        id: 'mapbox.run-bike-hike',
        accessToken: 'pk.eyJ1IjoiYmF0cGxhbnQiLCJhIjoiY2poNmw5ZGVsMDAxZzJ4cnpxY3V0bGprYSJ9.pbszY5VsvzGjHeNMx0Jokw'
    }).addTo(map);
}
/** A Map Tips legend in the bottom left of the map. Tips toggle open on click. */
function addTipsLegend() {
    const legend = L.control({position: 'bottomleft'});
    legend.onAdd = addViewTips;
    legend.addTo(map);
}
function addViewTips(map) {
    const div = _u.buildElem('div', { id: 'tips-legend', class: 'info legend flex-col'});
    div.innerHTML = getDefaultTipTxt();
    $(div).click(toggleTips)
    return div;
}
function getDefaultTipTxt() {
    return `<b>- (Click to Expand Map Tips) -</b>`;
}
function setExpandedTipText() {
    $('#tips-legend').html(`
        <b><center>- (Click to Collapse Map Tips) -</center>
        - Click on a marker to keep its popup open.<br>
        - Hover over truncated(...) text to show full text.`);
    $('#tips-legend').data('expanded', true);
}
function setDefaultTipText() {
    $('#tips-legend').html(getDefaultTipTxt());
    $('#tips-legend').data('expanded', false);
}
function toggleTips() {
    return $('#tips-legend').data('expanded') ? 
        setDefaultTipText() : setExpandedTipText();
}
function addGeoCoderToMap() {
    const opts = getGeocoderOptions();
    L.Control.geocoder(opts).on('markgeocode', drawPolygon).addTo(map);         console.log('geoCoder = %O', geoCoder.reverse);
}
function getGeocoderOptions() {
    geoCoder = L.Control.Geocoder.bing('AocU2CuvrrlUIkS8xwGLy1AZVDmWacJ8PHODmFLyOiRYhkU55fUhB1CpEhOz1B2L');
    geoCoder.geocode = customGeocode;
    return {
        defaultMarkGeocode: false,
        position: 'topleft',
        geocoder: geoCoder
    };
}
function drawPolygon(e) {                                                       console.log("geocoding results = %O", e);
    const bbox = e.geocode.bbox;
    if (poly) { map.removeLayer(poly); }
    poly = L.polygon([
        bbox.getSouthEast(),
        bbox.getNorthEast(),
        bbox.getNorthWest(),
        bbox.getSouthWest()
    ]).addTo(map);
    map.fitBounds(poly.getBounds());
}
/** Added 'Address' to the geocoding results returned. */
function customGeocode(query, cb, context) {
    jsonp(
        'https://dev.virtualearth.net/REST/v1/Locations',
        { query: query, key: this.key },
        buildResultData,
        this,
        'jsonp'
    );
    function buildResultData(data) {                                            //console.log('data returned = %O', data);
        var results = [];
        if (data.resourceSets.length > 0) {
            for (var i = data.resourceSets[0].resources.length - 1; i >= 0; i--) {
                var resource = data.resourceSets[0].resources[i],
                bbox = resource.bbox;
                results[i] = {
                    name: resource.name,
                    address: resource.address,
                    bbox: L.latLngBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]),
                    center: L.latLng(resource.point.coordinates)
                };
            }
        }
        cb.call(context, results);
    }
}
/*============== Search Database Page Methods ================================*/
/** Initializes the legends used for the search page map. */
function buildSrchPgMap() {
    addMarkerLegend();
    addIntCountLegend();
    hidePopUpMsg();
}
function addMarkerLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = addMarkerLegendHtml;
    legend.addTo(map);
}
function addMarkerLegendHtml(map) {
    const div = _u.buildElem('div', { class: 'info legend flex-col'});
    div.innerHTML += `<h4> Interaction Density </h4>`;
    addDensityHtml()
    return div;
    
    function addDensityHtml() {    
        const densities = ['Light', 'Medium', 'Heavy'];
        const colors = ['110, 204, 57', '240, 194, 12', '241, 128, 23'];

        for (var i = 0; i < densities.length; i++) {
            div.innerHTML +=
                `<span><i style="background: rgba(${colors[i]}, .9);"></i> 
                    ${densities[i]}</span>`;
        }
    }
};
function addIntCountLegend() {
    const legend = L.control({position: 'topright'});
    legend.onAdd = addIntCntLegendHtml;
    legend.addTo(map);
}
function addIntCntLegendHtml(map) {
    const div = _u.buildElem('div', { id: 'int-legend', class: 'info legend flex-col'});
    return div;
}
function fillIntCntLegend(shown, notShown) {
    const legend = $('#int-legend')[0];
    legend.innerHTML = `<h4>${shown + notShown} Interactions Total </h4>`;
    legend.innerHTML += `<span><b>${shown} shown on map</b></span><span>
        ${notShown} without GPS data</span>`;
}
/** ---------------- Init Map ----------------------------------------------- */
export function initMap(rcrds) {                                                console.log('attempting to initMap')
    locRcrds = rcrds;
    waitForDataThenContinue(buildAndShowMap.bind(null, addAllIntMrkrsToMap, 'map'));                                                 
}
/** ---------------- Show Location on Map ----------------------------------- */
/** Centers the map on the location and zooms according to type of location. */
export function showLoc(id, zoom, rcrds) {                 
    locRcrds = rcrds;        
    waitForDataThenContinue(buildAndShowMap.bind(null, showLocInMap, 'map'));
    
    function showLocInMap() {
        const loc = locRcrds[id];                                               console.log('show loc = %O, zoom = %s', loc, zoom)
        const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId); 
        if (!latLng) { return noGeoDataErr(); }
        zoomToLocAndShowPopup(loc, latLng, zoom);
        addAllIntMrkrsToMap();

        function noGeoDataErr() {
            console.log('###### No geoJson found for geoJson [%s] ###########', id);
        }
    }
}
function zoomToLocAndShowPopup(loc, latLng, zoom) {
    const popup = popups[loc.displayName] || buildLocPopup(loc, latLng);
    popup.setContent(MM.getLocationSummaryHtml(loc, locRcrds));  
    popup.options.autoClose = false;
    map.openPopup(popup); 
    map.setView(latLng, zoom, {animate: true});  
}
function buildLocPopup(loc, latLng) {  
    const popup = L.popup().setLatLng(latLng).setContent('');
    popups[loc.displayName] = popup;  
    return popup;
}
/* --- Show All Interaction Markers --- */
/**
 * Default Location "Map View":
 * Adds a marker to the map for each interaction with any location data. Each 
 * marker has a popup with either the location name and the country, just the  
 * country or region name. Locations without gps data are added to markers at  
 * the country level with "Unspecified" as the location name. Inside the popups
 * is a "Location" button that will replace the name popup with a 
 * summary of the interactions at the location.
 */
function addAllIntMrkrsToMap() {  
    let ttlShown = 0, 
    ttlNotShown = 0;
    const regions = getRegionLocs();
    addMapMarkers();
    fillIntCntLegend(ttlShown, ttlNotShown);

    function addMapMarkers() {
        for (let id in regions) { 
            trackIntCnt(regions[id]);
            addMarkersForRegion(regions[id]) 
        };
    }
    function trackIntCnt(region) {
        if (region.displayName === "Unspecified") { 
            return ttlNotShown += region.totalInts; 
        }
        ttlShown += region.totalInts;
    }
} 
function getRegionLocs() {
    const regionIds = _u.getDataFromStorage('topRegionNames');
    return Object.values(regionIds).map(id => locRcrds[id]);
}
function addMarkersForRegion(region) {
    if (region.displayName === "Unspecified") { return; }
    addMarkersForLocAndChildren(region);
}
function addMarkersForLocAndChildren(topLoc) {                                 
    if (!topLoc.totalInts) { return; }                                          //console.log('addMarkersForLocAndChildren for [%s] = %O', topLoc.displayName, topLoc);
    let intCnt = topLoc.totalInts; 
    buildMarkersForLocChildren(topLoc.children);                               
    if (intCnt) { buildLocationMarkers(intCnt, topLoc); }

    function buildMarkersForLocChildren(locs) {
        locs.forEach(id => {
            let loc = locRcrds[id];
            if (loc.locationType.displayName == 'Country') { 
                return addMarkersForLocAndChildren(loc, false); 
            }
            buildLocationIntMarkers(loc, loc.interactions.length);
        });
    }
    function buildLocationIntMarkers(loc, locIntCnt) {                          //console.log('buildLocationIntMarkers for [%s]', loc.displayName, loc);
        if (loc.children.length) { return addMarkersForLocAndChildren(loc); }
        if (!locIntCnt) { return; }
        buildLocationMarkers(locIntCnt, loc);
    }
    function buildLocationMarkers(intCnt, loc) {                                //console.log('   buildLocationMarkers for [%s] = %O', loc.displayName, loc);
        const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId);                //console.log('        latLng = ', latLng)
        if (!latLng) { return logNoGeoJsonError(loc); }
        addMarkerForEachInteraction(intCnt, latLng, loc);
    }
    function logNoGeoJsonError(loc) {
        if (!loc.interactions.length) { return null; }
        if (locIsHabitatOfTopLoc(loc)) { return; }
        // console.log('###### No geoJson for [%s] %O', loc.displayName, loc)
    }
    function locIsHabitatOfTopLoc(loc) {
        const subName = loc.displayName.split('-')[0];
        const topName = topLoc.displayName;  
        return topName.indexOf(subName) !== -1;
    }
} /* End addMarkersForLocAndChildren */
/**----------------- Show Interaction Sets on Map --------------------------- */
/** Shows the interactions displayed in the data-table on the map. */
export function showInts(focus, tableData, rcrds) {                             //console.log('----------- showInts. tableData = %O', tableData);
    locRcrds = rcrds;
    waitForDataThenContinue(buildAndShowMap.bind(null, showIntsOnMap, 'map'));                                                 
    
    function showIntsOnMap() {                                                  console.log('showIntsOnMap! data = %O', tableData);
        const keys = Object.keys(tableData);                                     
        addIntCntsToLegend(tableData);
        addIntMarkersToMap(focus, tableData);
        zoomIfAllInSameRegion(tableData);
    }
} 
function addIntCntsToLegend(data) {
    let shwn = 0, notShwn = 0;
    Object.keys(data).forEach(trackIntCnts);
    fillIntCntLegend(shwn, notShwn);

    function trackIntCnts(geoId) {  
        if (geoId === 'none') { notShwn += data[geoId].ttl; 
        } else { shwn += data[geoId].ttl; }
    }
}
function addIntMarkersToMap(focus, data) {                                      //console.log('addMarkersToMap. data = %O', data);
    for (let geoId in data) {
        if (geoId === 'none') { continue; }
        buildAndAddIntMarker(focus, geoId, data[geoId]);
    }
}
function buildAndAddIntMarker(focus, geoId, data) {  
    const coords = getCoords(geoId);
    const intCnt = data.ttl;
    const MapMarker = buildIntMarker(focus, intCnt, coords, data);              //console.log('buildAndAddIntMarkers. intCnt = [%s] data = %O', intCnt, data);
    map.addLayer(MapMarker.layer);
}
function buildIntMarker(focus, intCnt, coords, data) {  
     return intCnt === 1 ? 
        new MM.IntMarker(focus, coords, data) : 
        new MM.IntCluster(map, intCnt, focus, coords, data);
}
function getCoords(geoId) {
    const geoJson = _u.getGeoJsonEntity(geoId);                         
    return getLatLngObj(geoJson.displayPoint);
}
function zoomIfAllInSameRegion(data) {  
    let region, latLng;
    getRegionData();
    zoomIfSharedRegion();

    function getRegionData() {
        locRcrds = _u.getDataFromStorage('location');
        for (let geoId in data) {
            if (geoId === 'none') { continue; }
            if (region === false) { return; }
            getRegion(data[geoId], geoId);
        }
    }
    function getRegion(geoData, geoId) {
        geoData.locs.forEach(loc => {  
            if (!latLng) { latLng = getCenterCoordsOfLoc(loc, geoId); }
            const regionName = getRegionName(loc);
            region = regionName == region || !region ? regionName : false;  
        });
    }
    function getRegionName(loc) {
        return loc.region ? loc.region.displayName : loc.displayName;  
    }
    function zoomIfSharedRegion() {  
        if (region) { map.setView(latLng, 3, {animate: true}); }
    }
}
/* -------------- Helpers ------------------------------------------------ */
function getCenterCoordsOfLoc(loc, geoJsonId) { 
    if (!geoJsonId) { return false; }                                           //console.log('geoJson obj = %O', geoJson[geoJsonId]);
    const locGeoJson = _u.getGeoJsonEntity(geoJsonId);  
    return getLatLngObj(locGeoJson.displayPoint); 
} 
/** Return a leaflet LatLng object from the GeoJSON Long, Lat point */
function getLatLngObj(point) {  
    if (!point) { return getLocCenterPoint(loc, locGeoJson); }                  //console.log('point = ', point)
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
function addMarkerForEachInteraction(intCnt, latLng, loc) {                     //console.log('       adding [%s] markers at [%O]', intCnt, latLng);
    const MapMarker = intCnt === 1 ? 
        new MM.LocMarker(latLng, loc, locRcrds) :
        new MM.LocCluster(map, intCnt, latLng, loc, locRcrds);
    popups[loc.displayName] = MapMarker.popup;  
    map.addLayer(MapMarker.layer);
} /* End addMarkerForEachInteraction */
/* --- Table Popup --- */
// function showPopUpMsg(msg) {                                                    //console.log("showPopUpMsg. msg = ", msg)
//     const popUpMsg = msg || 'Loading...';
//     $('#db-popup').text(popUpMsg);
//     $('#db-popup').addClass('loading'); //used in testing
//     $('#db-popup, #db-overlay').show();
//     fadeTable();
// }
function hidePopUpMsg() {
    $('#db-popup, #db-overlay').hide();
    $('#db-popup').removeClass('loading'); //used in testing
    showTable();
}
// function fadeTable() {
//     $('#borderLayout_eRootPanel, #tbl-tools, #tbl-opts').fadeTo(100, .3);
// }
function showTable() {
    $('#borderLayout_eRootPanel, #tbl-tools, #tbl-opts').fadeTo(100, 1);
}
/*===================== Location Form Methods ================================*/
export function isCoordInsideCntry(coords, cntry) { //30.6, 5.3 - Algeria
    const latLng = L.latLng(coords);
    // geoCoder.reverse(latLng, null, ifInsideCountry, null);

    function ifInsideCountry(result) { console.log('geocoder result = %O', result);
        
    }
}
export function addVolatileMapPin(val) {  
    if (!val || !gpsFieldsFilled()) { return removeMapPin(); }
    const latLng = getMapPinCoords();
    if (!latLng) { return; }
    replaceMapPin(latLng);
    map.setView(latLng, 5, {animate: true});
}
function gpsFieldsFilled() {
    return ['Latitude', 'Longitude'].every(field => {
        return $(`#${field}_row input`).val();
    });
}
function getMapPinCoords() {
    if (ifCoordFieldHasErr()) { return false; }
    return L.latLng($('#Latitude_row input').val(), $('#Longitude_row input').val());
}
function ifCoordFieldHasErr() {  
    const errField = coordHasErr('Latitude') ? 'Latitude' : 
        coordHasErr('Longitude') ? 'Longitude' : false;
    if (!errField) { return false; }
    db_forms.locCoordErr(errField);
    return true;
}
function coordHasErr(field) {
    const coord = $(`#${field}_row input`).val();
    const max = field === 'Latitude' ? 90 : 180;
    return isNaN(coord) ? true : coord > max ? true : false;    
}
function replaceMapPin(latLng) {
    const marker = new MM.LocMarker(latLng, null, null, 'new-loc');
    removeMapPin();
    volatilePin = marker.layer; 
    map.addLayer(marker.layer);  
}
function removeMapPin() {
    if (!volatilePin) { return; }
    map.removeLayer(volatilePin);
}
export function initFormMap(cntry, rcrds) {                                     console.log('attempting to initMap')
    locRcrds = locRcrds || rcrds;  
    waitForDataThenContinue(
        buildAndShowMap.bind(null, finishFormMap.bind(null, cntry), 'loc-map'));  
} 
function finishFormMap(cntryId) {
    addLocCountLegend();
    if (cntryId) { showCntryLocs(cntryId); }
    isCoordInsideCntry('30.6, 5.3', 'Algeria');
}
function showCntryLocs(id) {
    const cntry = locRcrds[id];
    const cntryLatLng = getCenterCoordsOfLoc(cntry, cntry.geoJsonId);
    addChildLocsToMap(cntry, cntryLatLng);
    map.setView(cntryLatLng, 4, {animate: true});  
}
function addChildLocsToMap(cntry, coords) {
    const noGpsLocs = [];
    const locs = getChildLocData(cntry);   
    addLocsWithGpsDataToMap();
    addCountToLegend(locs.length, noGpsLocs.length, cntry);
    if (noGpsLocs.length) { addLocsWithoutGpsDataToMap(noGpsLocs.length); }

    function addLocsWithGpsDataToMap() {
        locs.forEach(loc => {
            const latLng = getCenterCoordsOfLoc(loc, loc.geoJsonId);
            if (!latLng) { return noGpsLocs.push(loc); }
            const Marker = new MM.LocMarker(latLng, loc, locRcrds, 'form');
            map.addLayer(Marker.layer);
        });
    }
    function addLocsWithoutGpsDataToMap(cnt) {  
        const Marker = cnt === 1 ? 
            new MM.LocMarker(coords, cntry, locRcrds, 'form-noGps') : 
            new MM.LocCluster(map, cnt, coords, noGpsLocs, locRcrds, 'form-noGps');
        map.addLayer(Marker.layer);
    }
}
function getChildLocData(cntry) {                                               
    return cntry.children.map(id => locRcrds[id]).filter(loc => loc.totalInts > 0);
}
/*--- Location Count Legend ---*/
function addLocCountLegend() {
    const legend = L.control({position: 'topright'});
    legend.onAdd = addLocCountHtml;
    legend.addTo(map);
}
function addLocCountHtml() {
    return _u.buildElem('div', { id: 'cnt-legend', class: 'info legend flex-col'});
}
function addCountToLegend(ttlLocs, noGpsDataCnt, cntry) {
    const noGpsDataHtml = noGpsDataCnt === 0 ? null : 
        `<span style="align-self: flex-end;">${noGpsDataCnt} without GPS data</span>`;
    const plural = ttlLocs === 1 ? '' : 's';    
    let name = getLocName(cntry.displayName);
    $('#cnt-legend').html(`
        <h3 title='${cntry.displayName}'>${ttlLocs} location${plural} in ${name}</h3>
        ${noGpsDataHtml ? noGpsDataHtml : ''}`);
}
function getLocName(name) {
    name = name.split('[')[0];                                
    return name.length < 22 ? name : name.substring(0, 19)+'...';
}