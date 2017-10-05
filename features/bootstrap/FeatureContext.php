<?php

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;
// use Behat\MinkExtension\Context\MinkContext;
use Behat\MinkExtension\Context\RawMinkContext;

require_once(__DIR__.'/../../vendor/symfony/phpunit-bridge/bin/.phpunit/phpunit-5.7/vendor/autoload.php');
require_once __DIR__.'/../../vendor/symfony/phpunit-bridge/bin/.phpunit/phpunit-5.7/src/Framework/Assert/Functions.php';

/**
 * Defines application features from the specific context.
 */
class FeatureContext extends RawMinkContext implements Context
{
    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {

    }

    /**
     * Pauses the scenario until the user presses a key. Useful when debugging a scenario.
     *
     * @Then (I )break
     */
    public function iPutABreakpoint()
    {
        fwrite(STDOUT, "\033[s    \033[93m[Breakpoint] Press \033[1;93m[RETURN]\033[0;93m to continue...\033[0m");
        while (fgets(STDIN, 1024) == '') {}
        fwrite(STDOUT, "\033[u");
        return;
    }
    /** --------------------------- Database Funcs ---------------------------*/
    /**
     * @Given the database has loaded
     */
    public function theDatabaseHasLoaded()
    {
        $this->getSession()->wait( 5000, "$('.ag-row').length" );
        $row = $this->getSession()->getPage()->find('css', '[row=0]');
        assertNotNull($row, "There are no rows in the database grid.");
    }

    /** -------------------------- Page Interactions --------------------------*/

    /**
     * @Given I exit the tutorial
     */
    public function iExitTheTutorial()
    {
        $tutorial = $this->getSession()->getPage()->find('css', '.intro-tips');
        assertNotNull($tutorial, 'Tutorial is not displayed.');
        $this->getSession()->executeScript("$('.introjs-overlay').click();");
        sleep(1);
    }

    /**
     * @Given the database grid is in :view view
     */
    public function theDatabaseGridIsInSelectedView($view)
    {
        $vals = ['Taxon' => 'taxa', 'Location' => 'locs', 'Source' => 'srcs'];
        $this->getSession()->executeScript("$('#search-focus').val('$vals[$view]').change();");
        $selected = $this->getSession()->evaluateScript("$('#search-focus option:selected').text();");
        assertEquals($selected, $view, 'In "'.$selected.'" view; expected "'.$view.'"');
        sleep(1);
    }

    /**------------------ Grid Funcs -----------------------------------------*/
    /**
     * @Then the count column should show :count interactions
     */
    public function theCountColumnShouldShowInteractions($count)
    {
        $cell = $this->getSession()->getPage()->find('css', '[row=0] [colId="intCnt"]');
        assertContains($cell->getText(), $count, 'No interaction count found.');
    }
    /**
     * @Then data in the interaction rows
     */
    public function dataInTheInteractionRows()
    {   /** Data pulled from the Subject Taxon column. */
        $data = $this->getSession()->getPage()->find('css', '[colid="subject"] span');
        assertNotNull($data->getText(), 'No data found in the interaction rows.');
    }

    /**
     * @Then I should see :count rows in the grid data tree
     */
    public function iShouldSeeRowsInTheGridDataTree($count)
    {
        $rows = $this->getSession()->getPage()->findAll('css', '.ag-body-container>div'); 
        assertCount(intval($count), $rows, 'There are "'.count($rows).'" rows displayed; Expected "'.$count.'"');
    }

    /**
     * @Then I should see :text in the tree
     */
    public function iShouldSeeInTheTree($text)
    {   
        $treeNodes = $this->getSession()->getPage()->findAll('css', '[colid="name"] span.ag-group-value span'); 
        assertNotNull($treeNodes);  
        $found = false;
        for ($i=0; $i < count($treeNodes); $i++) { 
            if ($treeNodes[$i]->getText() === $text) { $found = true; break;}
        }
        assertTrue($found, '"'.$text.'" is not displayed in grid data-tree.');
    }

    /** ------------------Taxon View -----------------------------------------*/

    /**
     * @When I group taxa by :realm
     */
    public function iGroupTaxaBy($realm)
    {
        $vals = ['Bat' => 2, 'Plant' => 3, 'Arthropod' => 4];
        $this->getSession()->executeScript("$('#sel-domain').val($vals[$realm]).change();");
        $selected = $this->getSession()->evaluateScript("$('#sel-domain option:selected').text();");
        assertEquals($selected, $realm, 'Taxa grouped by "'.$selected.'"; Expected "'.$realm.'"');
    }


}
