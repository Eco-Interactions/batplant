/**
 * Source-core configuration. Will be merged with the source detail-entity confg
 */
export default function(entity) {
    return {
        fields: getSourceFieldConfg(),
    };
}

function getSourceFieldConfg() {
    return {   //MERGED AND OVERWRITTEN WITH DETAIL.FIELDS
        Author: {  // handle merging this and editor and their field trans
            count: 1,
            entity: 'Contribution',
            label: false,
            misc: {
                customValueStore: true
            },
            name: 'Author',
            prop: {
                core: 'Contributor'
            },
            type: 'multiSelect',
            value: {} //Added here so property exists as obj on init
        },
        Description: {
            name: 'Description',
            prop: { // TODO DRY
                core: 'Description',
                detail: 'Description'
            },
            type: 'textArea',
        },
        DisplayName: {
            name: 'DisplayName',
            prep: {    // TODO: DRY
                setDisplayName: [],
                setDisplayName: ['detail']
            },
            required: true,
            type: 'text',
        },
        Doi: {
            name: 'Doi',
            type: 'doi',
        },
        Editor: {
            count: 1,
            entity: 'Contribution',
            label: false,
            misc: {
                customValueStore: true
            },
            name: 'Editor',
            prop: {
                core: 'Contributor'
            },
            type: 'multiSelect',
            value: {} //Added here so property exists as obj on init
        },
        ParentSource: {
            entity: 'Source',
            name: 'ParentSource',
            type: 'text',
        },
        SourceType: {
            entity: 'SourceType',
            name: 'SourceType',
            prep: {
                setCoreType: []
            },
            required: true,
            type: null
        },
        Website: {
            name: 'Website',
            prep: { //func: [args]
                renameField: ['LinkUrl'],
            },
            type: 'url',
        },
        Year: {
            class: 'xsml-field no-grow',
            name: 'Year',
            required: true,
            type: 'year',
        },
    }
}