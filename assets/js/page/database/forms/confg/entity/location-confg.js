/**
 * Location form configuration.
 */
export default function(entity) {
	return {
        name: entity,
        fields: getLocationFieldConfg(),
        views: {
            all: [
                ['Latitude', 'Longitude'],
                ['DisplayName', 'Description'],
                ['Country', 'HabitatType'],
                ['Elevation', 'ElevationMax']
            ]
        }
    };
}
function getLocationFieldConfg() {
    return {
        Country: {
            entity: 'Location',
            name: 'Country',
            prop: {
                core: 'parentLoc'
            },
            required: true,
            type: 'select',
        },
        DisplayName: {
            info: {
                intro: `Use the formal name of the location. If it doesn’t have a formal
                    name, use the following format to create a unique name using as
                    many descriptors as applicable: <br> [Habitat type], [Landmark, or
                    “Near” Landmark], [Town/City, or “Near” Town/City], [Province or State] `,
                tooltip: 'Use the formal name of the location. If it doesn’t ' +
                    'have a formal name, use the following format to create a unique ' +
                    'name using as many descriptors as applicable: [Habitat type], ' +
                    '[Landmark, or “Near” Landmark], [Town/City, or “Near” Town/City], ' +
                    '[Province or State]',
            },
            name: 'DisplayName',
            required: true,
            type: 'text',
        },
        Description: {
            name: 'Description',
            type: 'textArea',
        },
        Elevation: {
            info: {
                tooltip: 'If an elevation range is provided, put the uppermost ' +
                    'elevation here.',
            },
            name: 'Elevation',
            type: 'num',
        },
        ElevationMax: {
            name: 'ElevationMax',
            type: 'num',
        },
        HabitatType: {
            entity: 'HabitatType',
            info: {
                intro: 'See Habitat Type Definitions <a href="/definitions" ' +
                    'target="_blank">here</a>.',
                tooltip: 'See Habitat Type Definitions under About in the site menu.'
            },
            name: 'HabitatType',
            type: 'select',
        },
        LocationType: {
            name: 'LocationType',
            entity: 'LocationType',
            required: true
        },
        Longitude: {
            info: {
                intro: `Coordinates need to be entered in decimal degrees. Convert
                    using the <a href="https://www.fcc.gov/media/radio/dms-decimal"
                    target="_blank">FCC converter</a>. <br> Then see the green pin’s
                    popup for name suggestions`,
                tooltip: 'Coordinates need to be entered in decimal degrees. Convert ' +
                   'using the FCC converter at https://www.fcc.gov/media/radio/dms-decimal. ' +
                   'Then see the green pin’s popup for name suggestions',
            },
            name: 'Longitude',
            type: 'lng',
        },
        Latitude: {
            info: {
                intro: `Coordinates need to be entered in decimal degrees. Convert
                    using the <a href="https://www.fcc.gov/media/radio/dms-decimal"
                    target="_blank">FCC converter</a>. <br> Then see the green pin’s
                    popup for name suggestions`,
                tooltip: 'Coordinates need to be entered in decimal degrees. Convert ' +
                   'using the FCC converter at https://www.fcc.gov/media/radio/dms-decimal. ' +
                   'Then see the green pin’s popup for name suggestions',
            },
            name: 'Latitude',
            type: 'lat',  //merge with lng type?
        }
    };
}