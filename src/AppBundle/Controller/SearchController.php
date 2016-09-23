<?php

namespace AppBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;


/**
 * Search Page controller.
 *
 * @Route("/")
 */
class SearchController extends Controller
{
    /**
     * Finds and displays Search Page content blocks.
     *
     * @Route("/search", name="app_search")
     */
    public function searchAction()
    {
        $em = $this->getDoctrine()->getManager();

        $repo = $em->getRepository('AppBundle:ContentBlock');

        return $this->render('contentblock/search.html.twig', array());
    }
    /**
     * Returns the total number of interaction records.
     *
     * @Route("/search/interaction/count", name="app_search_int_cnt")
     */
    public function searchInteractionCountAction(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  
        $em = $this->getDoctrine()->getManager();

        $interactions = $em->getRepository('AppBundle:Interaction')->findAll();

        $response = new JsonResponse();
        $response->setData(array(
            'rcrdCount' => count($interactions)
        ));

        return $response;
        }
    /**------------------------Search By Taxa-------------------------------------*/
    /**
     * Get Domain Data.
     *
     * @Route("/search/domain", name="app_ajax_search_domain")
     */
    public function searchDomainAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  

        $em = $this->getDoctrine()->getManager();
        // $logger = $this->get('logger');

        $requestContent = $request->getContent();
        $pushedData = json_decode($requestContent);                             // $logger->error('SASSSSSSS:: pushedData ->' . print_r($pushedData, true));

        $returnObj = new \stdClass;

        $entities = $em->getRepository('AppBundle:Domain')->findAll();

        foreach ($entities as $entity) 
        {                                                                       // $logger->error('SASSSSSSS:: entity ->' . print_r('entity', true));
            $taxonId = strval($entity->getTaxon()->getId());
            $returnObj->$taxonId = [];
            $slug = $entity->getSlug();                                 // $logger->error('SASSSSSSS:: propVal ->' . print_r($propVal, true));
            $name = $entity->getPluralName();                                 // $logger->error('SASSSSSSS:: propVal ->' . print_r($propVal, true));

            $returnObj->$taxonId = array_merge( 
                $returnObj->$taxonId, [ 
                    "slug" => $slug, "name" => $name 
                ] 
            );
        }

        $response = new JsonResponse();
        $response->setData(array(
            'results' => $returnObj
        ));

        return $response;
    }

    /**
     * Get Interaction IDs by Taxa.
     *
     * @Route("/search/taxa", name="app_ajax_search_taxa")
     */
    public function searchTaxaAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  

        $em = $this->getDoctrine()->getManager();
        // $logger = $this->get('logger');
        $requestContent = $request->getContent();
        $pushedParams = json_decode($requestContent); //$logger->error('SASSSSSSS:: pushedParams ->' . print_r($pushedParams, true));

        $returnObj = new \stdClass;

        $taxa = $em->getRepository('AppBundle:Taxon')->findAll();

        foreach ($taxa as $taxon) 
        {
            $this->getTaxonData($taxon, $pushedParams, $returnObj);
        }

        $response = new JsonResponse();
        $response->setData(array(
            'results' => $returnObj
        ));

        return $response;
    }
    private function getTaxonData($taxon, $params, $returnObj) 
    {
        $taxonId = $taxon->getId();
        $taxonKey = strval($taxonId);

        $returnObj->$taxonKey = new \stdClass;

        foreach ($params->props as $prop) 
        {
            $getProp = 'get' . ucfirst($prop);
            $returnObj->$taxonKey->$prop = $taxon->$getProp();           
        }

        $returnObj->$taxonKey->id = $taxon->getId();
        $returnObj->$taxonKey->children = $this->getChildren($taxon, $params);
        $returnObj->$taxonKey->parentTaxon = $taxon->getParentTaxon() ?
            $taxon->getParentTaxon()->getId() : null ;           
        $returnObj->$taxonKey->level = $taxon->getLevel()->getName();                //getInteractions($taxon);
        $returnObj->$taxonKey->interactions = $this->getTaxaInteractions($taxon, $params);
    }
    private function getChildren($taxon, $params)
    {
        $childEntities = $taxon->getChildTaxa();
        $children = [];

        foreach ($childEntities as $child)
        {
            array_push($children, $child->getId());
        }
        return $children;
    }
    private function getTaxaInteractions($taxon, $params) 
    {
        $intRcrds = new \stdClass;

        foreach ($params->roles as $role) 
        {
            $getIntRcrds = 'get' . $role; 
            $interactions = $taxon->$getIntRcrds();
            $intRcrds->$role = $this->getInteractions($interactions, $params);
        }
        return $intRcrds;
    }
/**------------------------Search By Location---------------------------------*/

    /**
     * Get Interactions IDs by Region and Location.
     *
     * @Route("/search/location", name="app_ajax_search_location")
     */
    public function searchLocationsAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  

        $em = $this->getDoctrine()->getManager();
        // $logger = $this->get('logger');            // $logger->error('SASSSSSSS:: pushedData ->' . print_r($pushedData, true));

        $intsByRegion = new \stdClass;

        $locations = $em->getRepository('AppBundle:Location')->findAll();

        foreach ($locations as $location) 
        {                     //  $logger->error('SASSSSSSS:: location ->' . print_r($location, true));
            $loc = new \stdClass;

            $loc->id = $location->getId();
            $loc->desc = $location->getDescription();
            $loc->elev = $location->getElevation();
            $loc ->elevMax = $location->getElevationMax();
            $loc->elevUnit = $location->getElevUnitAbbrv();
            $loc->gpsData = $location->getGpsData();
            $loc->lat = $location->getLatitude();
            $loc->long = $location->getLongitude();
            $loc->habitatType = $location->getHabitatType() === null ? null : $location->getHabitatType()->getName();  // $logger->error('SASSSSSSS:: getting interactions...');
            $interactions = $location->getInteractions();
            $loc->interactions = $this->getInteractions($interactions);

            $region = $this->getLocRegions($location->getRegions());            //$logger->error('SASSSSSSSSSSSS:: region = ' . print_r($region, true));
            $loc->region = $region;

            if ($location->getCountry() === null) {
                $country =  null;
                $countryId = null;
            } else { 
                $country = $location->getCountry()->getName();
                $countryId = $location->getCountry()->getId();
            }
            $loc->country = $country;
            $loc->countryId = $countryId;

            if ( !property_exists($intsByRegion, $region) ) {  ///$logger->error('SASSSSSSSSSSSS:: region property being created with country = ' . print_r($region, true));
                $intsByRegion->$region = new \stdClass; 
            }
            if ( $country === null ) { // 
                $locDesc = $loc->desc;
                if ( !property_exists($intsByRegion->$region, $locDesc) ) { 
                    $intsByRegion->$region->$locDesc = []; 
                }                
                array_push( $intsByRegion->$region->$locDesc, $loc ); 
            } else {
                if ( !property_exists($intsByRegion->$region, $country) ) { 
                    $intsByRegion->$region->$country = []; 
                }
                $intsByRegion->$region->$country = array_merge( 
                    $intsByRegion->$region->$country, [ $loc->id => $loc ]
                );            
            }
        }  // $logger->error('SASSSSSSSSSSSS:: about to return... ->' . print_r($intsByRegion, true));

        $response = new JsonResponse();
        $response->setData(array(
            'results' => $intsByRegion              //$intsByRegion
        ));

        return $response;
    }
    private function getLocRegions($regionEntities)  /*Can't figure out how to properly access the first propeprty, i.e. the first region, so only the first region is being used currently.*/
    {
        if ($regionEntities[0] !== null) {
            $region = $regionEntities[0]->getDescription();
            // $regionAry = explode(",", $region);
            return $region;              //$regionAry[0];
        } else {
            return "Unspecified";
        }
    }
    /**
     * Get Interactions.
     *
     * @Route("/search/interaction", name="app_ajax_search_interaction")
     */
    public function searchInteractionAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  

        $em = $this->getDoctrine()->getManager();
        // $logger = $this->get('logger');            // $logger->error('SASSSSSSS:: pushedData ->' . print_r($pushedData, true));

        $intRcrds = new \stdClass;

        $interactions = $em->getRepository('AppBundle:Interaction')->findAll();

        foreach ($interactions as $int) 
        {                     //  $logger->error('SASSSSSSS:: location ->' . print_r($location, true));
            $rcrd = new \stdClass;
            $intId = $int->getId();
            $rcrd->id = $intId;
            $rcrd->note = $int->getNote();
            $rcrd->citation = $int->getCitation()->getDescription();
            $rcrd->interactionType = $int->getInteractionType()->getName();
            $rcrd->subject = array(
                "name" => $int->getSubject()->getDisplayName(),
                "level" => $int->getSubject()->getLevel()->getName(),
                "id" => $int->getSubject()->getId() );  // $logger->error('SASSSSSSS:: $rcrd->subject ->' . print_r($rcrd->subject, true));
            $rcrd->object = array(
                "name" => $int->getObject()->getDisplayName(),
                "level" => $int->getObject()->getLevel()->getName(),
                "id" => $int->getObject()->getId() );
            $rcrd->tags = $this->getTagAry($int->getTags());  

            if ($int->getLocation() !== null) {
                $rcrd->location = $int->getLocation()->getDescription();
                $rcrd->country = $int->getLocation()->getCountry() === null ?
                    null : $int->getLocation()->getCountry()->getName() ;
                $rcrd->region = $int->getLocation()->getCountry() === null ?
                    null : $int->getLocation()->getCountry()->getRegion()->getDescription() ;
                $rcrd->habitatType = $int->getLocation()->getHabitatType() === null ?
                    null : $int->getLocation()->getHabitatType()->getName() ;
            }
            
            $intRcrds->$intId = $rcrd;
        }
        $response = new JsonResponse();
        $response->setData(array(
            'results' => $intRcrds
        ));

        return $response;
    }
/**------------------------Shared Search Methods------------------------------*/
    private function getInteractions($interactions)
    {
        if ( count($interactions) === 0 ) { return null; }
        $intRcrds = [];

        foreach ($interactions as $int) 
        {
            array_push( $intRcrds, $int->getId() );
        }
        return $intRcrds;
    }
    private function getTagAry($tags)
    {
        $ary = [];
        foreach ($tags as $tag) 
        {
            array_push($ary, $tag->getTag());
        }
        return $ary;
    }
}