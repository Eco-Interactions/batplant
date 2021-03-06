@db-edit-data
Feature: Edit data in the database
    In order to have accurate data about bat eco-interactions
    As an editor
    I need to be able to edit the data in the database

    ### WHAT IS BEING TESTED ###
        # THE EDITOR ISSUE-REPORT FORM
        # ENTITY EDITS AND RELATED UPDATES TO STORED DATA AND TABLE DISPLAY
        ## TODO
        # Test form error handling
        # Test changing an interaction's citation

    Background:
        Given the fixtures have been reloaded
        And I am on "/login"
        And I fill in "Username" with "TestEditor"
        And I fill in "Password" with "passwordhere"
        And I press the "_submit" button
        And I am on "/search"
        And I see "TestEditor"
        Given the database has loaded
        And I exit the tutorial
  ## ------------------------- ISSUE REPORT ----------------------------------##
    @javascript
    Scenario:  I should be able to open the issue-report form
        Given I break "Open console"
        And I press the "data-help" button
        And I see "Experiencing issues?"
        When I press the "Report A Bug" button
        Then I see "Upload screenshots if relevant:"

  ## -------------------------- Interaction ----------------------------------##
    @javascript
    Scenario:  I should be able to change an interaction's location
        Given the database table is grouped by "Locations"
        And I expand "Central America" in the data tree
        And I expand "Panama" in the data tree
        And I click on the edit pencil for the first interaction of "Summit Experimental Gardens"
        And I see "Editing Interaction"
        When I select "Panama" from the "Location" combobox
        And I press the "Update Interaction" button
        And I wait for the "top" form to close
        And I uncheck the date-updated filter
        And I expand "Central America" in the data tree
        And I expand "Panama" in the data tree
        Then I should see "3" interactions under "Unspecified Panama Interactions"
        And I should not see "Summit Experimental Gardens" under "Panama" in the tree

    @javascript
    Scenario:  I should be able to change an interaction's subject taxon
        Given the database table is grouped by "Taxa"
        And I view interactions by "Bats"
        And I expand "Family Phyllostomidae" in the data tree
        And I click on the edit pencil for the first interaction of "Unspecified Phyllostomidae Interactions"
        And I see "Editing Interaction"
        And I focus on the "Subject" taxon field
        And I see "Select Subject Taxon"
        When I select "Artibeus lituratus" from the "Species" combobox
        And I should see "Artibeus" in the "Genus" combobox
        And I press the "Select Taxon" button
        And I press the "Update Interaction" button
        And I wait for the "top" form to close
        And I uncheck the date-updated filter
        And I expand "Family Phyllostomidae" in the data tree
        And I expand "Genus Artibeus" in the data tree
        Then I should see "2" interactions under "Artibeus lituratus"
        And I should see "1" interactions under "Unspecified Phyllostomidae Interactions"

    @javascript
    Scenario:  I should be able to change an interaction's object taxon
        Given the database table is grouped by "Taxa"
        And I view interactions by "Plants"
        And I expand "Family Araceae" in the data tree
        And I click on the edit pencil for the first interaction of "Unspecified Araceae Interactions"
        And I see "Editing Interaction"
        And I focus on the "Object" taxon field
        And I see "Select Object Taxon"
        When I select "Philodendron sphalerum" from the "Species" combobox
        And I should see "Philodendron" in the "Genus" combobox
        And I press the "Select Taxon" button
        And I press the "Update Interaction" button
        And I wait for the "top" form to close
        And I uncheck the date-updated filter
        And I expand "Family Araceae" in the data tree
        And I expand "Genus Philodendron" in the data tree
        Then I should see "2" interactions under "Philodendron sphalerum"
        And I should see "1" interactions under "Unspecified Araceae Interactions"

    @javascript
    Scenario:  I should be able to change an interaction's type, tags, and notes
        Given the database table is grouped by "Taxa"
        And I view interactions by "Plants"
        And I expand "Family Araceae" in the data tree
        And I click on the edit pencil for the first interaction of "Unspecified Araceae Interactions"
        And I see "Editing Interaction"
        When I select "Consumption" from the "Interaction Type" combobox
        And I remove the "Flower" interaction tag
        And I add the "Seed" interaction tag
        And I change the "Note" field "textarea" to "New Test Note Description"
        And I press the "Update Interaction" button
        And I wait for the "top" form to close
        And I expand "Family Araceae" in the data tree
        And I click on the edit pencil for the first interaction of "Unspecified Araceae Interactions"
        And I see "Editing Interaction"
        Then I should see "Consumption" in the "Interaction Type" combobox
        Then I should see the "Seed" interaction tag
        Then I should not see the "Flower" interaction tag
        Then I should see "New Test Note Description" in the "Note" field "textarea"

    # @javascript
    # Scenario:  I should be able to change an interaction's citation  #TODO
    #   Given the database table is grouped by "Sources"
    #   And I view interactions by "Publications"
    #   And I break
    #   And I expand "Biology of bats of the New World family Phyllostomatidae" in the data tree
    #   And I click on the edit pencil for the first interaction of "Feeding habits"
    #   And I see "Editing Interaction"
    #   When I change the "Publication" combobox to "Book of Mammalogy"
    #   And I change the "Citation Title" combobox to "Observations on the life histories of Panama bats"
    #   And I press the "Update Interaction" button
    #     And I wait for the "top" form to close
    #   And I uncheck the date-updated filter
    #   And I expand "Biology of bats of the New World family Phyllostomatidae" in the data tree
    #   And I expand "Book of Mammalogy" in the data tree
    #   Then I should see "3" interactions under "Observations on the life histories of Panama bats"
    #   And I should see "3" interactions under "Feeding habits"

  # -------------------------- Location -------------------------------------##
    @javascript
    Scenario:  I should be able to edit the data of an existing location
        Given the database table is grouped by "Locations"
        And I expand "Central America" in the data tree
        And I expand "Costa Rica" in the data tree
        And I click on the edit pencil for the "Santa Ana-Forest" row
        And I see "Editing Location"
        When I change the "Display Name" field "input" to "Santa Ana-Captivity"
        And I change the "Description" field "textarea" to "Description..."
        And I select "Captivity" from the "Habitat Type" combobox
        And I change the "Elevation" field "input" to "1000"
        And I change the "Elevation Max" field "input" to "2000"
        And I change the "Latitude" field "input" to "9.7489"
        And I change the "Longitude" field "input" to "-83.7534"
        And I see the location's pin on the map
        And I press the "Update Location" button
        And I wait for the "top" form to close
        And I expand "Central America" in the data tree
        And I expand "Costa Rica" in the data tree
        And I click on the edit pencil for the "Santa Ana-Captivity" row
        And I see "Editing Location"
        Then I should see "Santa Ana-Captivity" in the "Display Name" field "input"
        And I should see "Description..." in the "Description" field "textarea"
        Then I should see "Captivity" in the "Habitat Type" combobox
        Then I should see "1000" in the "Elevation" field "input"
        Then I should see "2000" in the "Elevation Max" field "input"
        Then I should see "9.7489" in the "Latitude" field "input"
        Then I should see "-83.7534" in the "Longitude" field "input"

    @javascript
    Scenario:  I should be able to change the parent of an existing location
        Given the database table is grouped by "Locations"
        And I expand "Central America" in the data tree
        And I expand "Costa Rica" in the data tree
        And I click on the edit pencil for the "Santa Ana-Forest" row
        When I select "Panama" from the "Country" combobox
        And I press the "Update Location" button
        And I wait for the "top" form to close
        And I expand "Central America" in the data tree
        Then I should see "Santa Ana-Forest" under "Panama" in the tree
        And I should not see "Santa Ana-Forest" under "Costa Rica" in the tree

  ## -------------------------- Source ---------------------------------------##
    @javascript
    Scenario:  I should be able to edit the data of an existing publication
        Given the database table is grouped by "Sources"
        And I click on the edit pencil for the "Journal of Mammalogy" row
        And I see "Editing Publication"
        When I change the "Title" field "input" to "Book of Mammalogy"
        And I select "Book" from the "Publication Type" combobox
        And I change the "Description" field "textarea" to "Description..."
        And I change the "Year" field "input" to "1993"
        And I change the "Website" field "input" to "https://www.link.com"
        And I change the "Doi" field "input" to "https://doi.org/10.1037/rmh0000008"
        And I select "University of Paris VI" from the "Publisher" combobox
        And I select "Cockle, Anya" from the "Authors" dynamic combobox
        And I press the "Update Publication" button
        And I press submit in the confirmation popup
        And I wait for the "top" form to close
        And I select "Book" from the "Publication Type Filter" combobox
        And I click on the edit pencil for the "Book of Mammalogy" row
        And I see "Editing Publication"
        Then I should see "Book of Mammalogy" in the "Title" field "input"
        Then I should see "Description..." in the "Description" field "textarea"
        Then I should see "Book" in the "Publication Type" combobox
        Then I should see "https://www.link.com" in the "Website" field "input"
        Then I should see "University of Paris VI" in the "Publisher" combobox
        Then I should see "Cockle, Anya" in the "Authors" dynamic combobox

    @javascript
    Scenario:  I should be able to edit the data of an existing author
        Given the database table is grouped by "Sources"
        And I view interactions by "Authors"
        And I click on the edit pencil for the "Cockle, Anya" row
        And I see "Editing Author"
        When I change the "First Name" field "input" to "Joy"
        And I change the "Middle Name" field "input" to "Karen"
        And I change the "Last Name" field "input" to "Cockel"
        And I change the "Suffix" field "input" to "Jr"
        And I change the "Website" field "input" to "https://www.link.com"
        And I press the "Update Author" button
        And I wait for the "top" form to close
        And I click on the edit pencil for the "Cockel, Joy Karen Jr" row
        And I see "Editing Author"
        Then I should see "Joy" in the "First Name" field "input"
        Then I should see "Karen" in the "Middle Name" field "input"
        Then I should see "Cockel" in the "Last Name" field "input"
        Then I should see "Jr" in the "Suffix" field "input"
        Then I should see "https://www.link.com" in the "Website" field "input"

    @javascript
    Scenario:  I should be able to edit the data of an existing publisher
        Given the database table is grouped by "Sources"
        And I view interactions by "Publishers"
        And I click on the edit pencil for the "University of Paris VI" row
        And I see "Editing Publisher"
        When I change the "Display Name" field "input" to "University of Paris V"
        And I change the "City" field "input" to "Nice"
        And I change the "Country" field "input" to "France"
        And I change the "Description" field "textarea" to "Something descriptive"
        And I change the "Website" field "input" to "https://www.link.com"
        And I press the "Update Publisher" button
        And I wait for the "top" form to close
        And I click on the edit pencil for the "University of Paris V" row
        And I see "Editing Publisher"
        Then I should see "Nice" in the "City" field "input"
        Then I should see "France" in the "Country" field "input"
        Then I should see "Something descriptive" in the "Description" field "textarea"
        Then I should see "https://www.link.com" in the "Website" field "input"

    #todo - test proper removal of citation from authors in tree
    @javascript
    Scenario:  I should be able to edit the data of an existing citation [CHAPTER->BOOK]
        Given the database table is grouped by "Sources"
        And I view interactions by "Authors"
        And I expand "Gardner, Alfred L" in the data tree
        When I click on the edit pencil for the "Feeding habits" row
        And I see "Editing Citation"
        And I select "Book" from the "Citation Type" combobox
        And I change the "Abstract" field "textarea" to "Test Abstract"
        And I change the "Edition" field "input" to "4"
        And I change the "Website" field "input" to "https://www.link.com"
        And I change the "Doi" field "input" to "https://doi.org/10.1037/rmh0000008"
        And I change "Baker, Herbert G" in the "Authors" dynamic combobox
        And I select "Cockle, Anya" from the "Authors" dynamic combobox
        And I see "Baker, H. G. & A. Cockle. 1977. Biology of bats of the New World family Phyllostomatidae (P. Bloedel, ed.). 4. Britanica Books, Wellingsworth, Britan." in the "Citation Text" field "textarea"
        And I press the "Update Citation" button
        And I press submit in the confirmation popup
        And I wait for the "top" form to close
        And I should not see "Gardner, Alfred L" in the tree
        And I expand "Baker, Herbert G" in the data tree
        And I click on the edit pencil for the "Feeding habits" row
        And I see "Editing Citation"
        Then I should see "Baker, H. G. & A. Cockle. 1977. Biology of bats of the New World family Phyllostomatidae (P. Bloedel, ed.). 4. Britanica Books, Wellingsworth, Britan." in the "Citation Text" field "textarea"
        And I should see "Test Abstract" in the "Abstract" field "textarea"
        And I should see "Feeding habits" in the "Title" field "input"
        And I should see "Book" in the "Citation Type" combobox
        And I should see "4" in the "Edition" field "input"
        And I should see "https://www.link.com" in the "Website" field "input"
        And I should see "https://doi.org/10.1037/rmh0000008" in the "Doi" field "input"
        And I should see "Baker, Herbert G" in the "Authors" dynamic combobox
        And I should see "Cockle, Anya" in the "Authors" dynamic combobox

    @javascript
    Scenario:  I should be able to change an interaction's publication
        Given the database table is grouped by "Sources"
        And I view interactions by "Publications"
        And I expand "Biology of bats of the New World family Phyllostomatidae" in the data tree
        And I click on the edit pencil for the first interaction of "Feeding habits"
        And I see "Editing Interaction"
        When I select "Journal of Mammalogy" from the "Publication" combobox
        And I select "Observations on the life histories of Panama bats" from the "Citation Title" combobox
        And I press the "Update Interaction" button
        # And I press submit in the confirmation popup
        And I wait for the "top" form to close
        And I uncheck the date-updated filter
        And I expand "Biology of bats of the New World family Phyllostomatidae" in the data tree
        And I expand "Journal of Mammalogy" in the data tree
        Then I should see "5" interactions under "Observations on the life histories of Panama bats"
        And I should see "3" interactions under "Feeding habits"

  ## -------------------------- Taxon ----------------------------------------##
    @javascript
    Scenario:  I should be able to edit the name and rank of an existing taxon
        Given the database table is grouped by "Taxa"
        And I view interactions by "Arthropods"
        And I click on the edit pencil for the "Order Lepidoptera" row
        And I see "Editing Taxon"
        When I change the "taxon name" field "input" to "Leopardil"
        When I select "Class" from the "Rank" combobox
        And I press the "Update Taxon" button
        And I wait for the "top" form to close
        Then I should see "Class Leopardil" in the tree

    @javascript
    Scenario:  I should be able to edit the parent taxon of an existing taxon
        Given the database table is grouped by "Taxa"
        And I view interactions by "Parasites"
        And I expand "Phylum Nematoda" in the data tree
        And I click on the edit pencil for the "Class Striped" row
        And I see "Editing Taxon"
        When I press "Change Parent"
        And I see "Select New Taxon Parent"
        When I select "Arthropod" from the "Group" combobox
        And I press the "Select" button
        And I press the "Update Taxon" button
        And I wait for the "top" form to close
        And I view interactions by "Arthropods"
        Then I should see "Class Striped" in the tree