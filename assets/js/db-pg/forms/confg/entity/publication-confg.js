/**
 * Publication form configuration.
 */
export default function() {
	return {
        'add': {
            'Title' : 'text',
            'PublicationType': 'select',
            'Publisher': 'select'
        },
        'required': [
            'PublicationType',
            'Title'
        ],
        'suggested': [],
        'optional': [],
        'order': {  //will be merged with type.order
            'sug': [
                ['Title', 'PublicationType']
            ],
            'opt': [
                ['Title', 'PublicationType']
            ]
        },
        'types': {
            'Book': {
                'name': 'Book',
                'required': [
                    'Authors',
                    'Editors',
                    'Publisher',
                    'Year'
                ],
                'suggested': [],
                'optional': [
                    'Description',
                    'LinkUrl',
                    'Doi'
                ],
                'order': {
                    'sug': [
                        ['Year', 'Publisher'],
                        ['Authors', 'Editors']
                    ],
                    'opt': [
                        ['Year', 'Doi'],
                        ['LinkUrl', 'Description'],
                        ['Publisher'],
                        ['Authors', 'Editors']
                    ]
                }
            },
            'Journal': {
                'name': 'Journal',
                'required': [],
                'suggested': [],
                'optional': [
                    'Year',
                    'Description',
                    'LinkUrl',
                    'Doi',
                    'Publisher'
                ],
                'order': {
                    'sug': [],
                    'opt': [
                        ['Year', 'Doi'],
                        ['LinkUrl', 'Description'],
                        ['Publisher'],
                    ]
                }
            },
            'Other': {
                'name': 'Other',
                'required': [
                    'Authors',
                    'Year'
                ],
                'suggested': [
                    'Publisher'
                ],
                'optional': [
                    'Description',
                    'LinkUrl',
                    'Doi'
                ],
                'order':  {
                    'sug': [
                        ['Year', 'Publisher'],
                        'Authors'
                    ],
                    'opt': [
                        ['Year', 'Doi'],
                        ['LinkUrl', 'Description'],
                        ['Publisher', 'Authors'],
                    ]
                }
            },
            'Thesis/Dissertation': {
                'name': 'Thesis/Dissertation',
                'required': [
                    'Authors',
                    'Publisher',
                    'Year'
                ],
                'suggested': [],
                'optional': [
                    'Description',
                    'LinkUrl',
                    'Doi'
                ],
                'order':  {
                    'sug': [
                        ['Year', 'Publisher'],
                        'Authors'
                    ],
                    'opt': [
                        ['Year', 'Doi'],
                        ['LinkUrl', 'Description'],
                        ['Publisher', 'Authors'],
                    ]
                }
            }
        }
    };
}