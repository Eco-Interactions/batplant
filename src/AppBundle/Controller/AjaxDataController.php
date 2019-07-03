<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;

/**
 * Ajax Data controller.
 *
 * @Route("/ajax")
 */
class AjaxDataController extends Controller
{
    /**
     * Returns an object with the lastUpdated datetime for the system and for 
     * each entity.
     *
     * @Route("/data-state", name="app_ajax_data_state")
     * @Method("POST")
     */
    public function getDataLastUpdatedState(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  
        $em = $this->getDoctrine()->getManager();
        $entities = $em->getRepository('AppBundle:SystemDate')->findAll();
        $state = new \stdClass;
        
        foreach ($entities as $entity) {
            $entityClass = $entity->getDescription();
            $state->$entityClass = $entity->getDateVal()->format('Y-m-d H:i:s');
        }
        $response = new JsonResponse();
        $response->setData(array(
            'dataState' => $state,
        ));
        return $response;
    }
    /**
     * Serializes and returns all entities of the passed class that have been 
     * updated since the passed 'lastUpdatedAt' time.
     *
     * @Route("/sync-data", name="app_ajax_sync_data")
     */
    public function getUpdatedEntityData(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  
        $em = $this->getDoctrine()->getManager(); 

        $pushedData = json_decode($request->getContent());
        $entity = $pushedData->entity;                                          //print("getAllUpdatedData for ".$coreEntity);
        $lastUpdatedAt = $pushedData->updatedAt;

        $data = $this->getAllUpdatedData($entity, $lastUpdatedAt, $em);

        $response = new JsonResponse(); 
        $response->setData(array( $entity => $data )); 
        return $response;        
    }
    /**
     * All entities updated since the lastUpdatedAt time are serialized and 
     * returned in a data object keyed by id.  
     */
    private function getAllUpdatedData($entityType, $lastUpdatedAt, &$em)
    {    
        $serializer = $this->container->get('jms_serializer');
        $data = new \stdClass;

        $entities = $this->getEntitiesWithUpdates($entityType, $lastUpdatedAt, $em);

        foreach ($entities as $entity) {   
            $id = $entity->getId();    
            $data->$id = $serializer->serialize($entity, 'json');
        }
        return $data;
    }
    /** Queries for all entities updated since the lastUpdatedAt time. */
    private function getEntitiesWithUpdates($entity, $lastUpdatedAt, &$em)
    {
        $repo = $em->getRepository('AppBundle:'.$entity);
        $query = $repo->createQueryBuilder('e')
            ->where('e.updated > :lastUpdated')
            ->setParameter('lastUpdated', $lastUpdatedAt)
            ->getQuery();
        return $query->getResult();
    }
    /**
     * Returns serialized data objects for the Realm, Level, and Taxon entities.
     *
     * @Route("/taxon", name="app_serialize_taxon")
     */
    public function serializeTaxonDataAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  
        $em = $this->getDoctrine()->getManager();
        $serializer = $this->container->get('jms_serializer');

        $realm = $this->serializeEntity('Realm', $serializer, $em);
        $level = $this->serializeEntity('Level', $serializer, $em);
        $taxon = $this->serializeEntity('Taxon', $serializer, $em);

        $response = new JsonResponse(); 
        $response->setData(array(                                    
            'realm' => $realm,    'level' => $level,
            'taxon' => $taxon            
        )); 
        return $response;
    }
    /**
     * Returns serialized data objects for Habitat Type, Location Type, and Location. 
     *
     * @Route("/location", name="app_serialize_location")
     */
    public function serializeLocationDataAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  

        $em = $this->getDoctrine()->getManager();
        $serializer = $this->container->get('jms_serializer');

        $habitatType = $this->serializeEntity('HabitatType', $serializer, $em);
        $location = $this->serializeEntity('Location', $serializer, $em);
        $locType = $this->serializeEntity('LocationType', $serializer, $em);

        $response = new JsonResponse();
        $response->setData(array( 
            'location' => $location,    'habitatType' => $habitatType,   
            'locationType' => $locType
        )); 
        return $response;
    }
    /**
     * Returns an object keyed with location ids with their geoJson as values. 
     *
     * @Route("/geo-json", name="app_serialize_geojson")
     */
    public function serializeGeoJsonDataAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  

        $em = $this->getDoctrine()->getManager();
        $serializer = $this->container->get('jms_serializer');
        $geoJson = $this->serializeEntity('GeoJson', $serializer, $em);

        $response = new JsonResponse();
        $response->setData(array( 
            'geoJson' => $geoJson
        )); 
        return $response;
    }
    /**
     * Returns serialized data objects for all entities related to Source. 
     *
     * @Route("/source", name="app_serialize_source")
     */
    public function serializeSourceDataAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  
        $em = $this->getDoctrine()->getManager();
        $serializer = $this->container->get('jms_serializer');

        $author = $this->serializeEntity('Author', $serializer, $em);
        $citation = $this->serializeEntity('Citation', $serializer, $em);
        $citType = $this->serializeEntity('CitationType', $serializer, $em);
        $publication = $this->serializeEntity('Publication', $serializer, $em);
        $pubType = $this->serializeEntity('PublicationType', $serializer, $em);
        $publisher = $this->serializeEntity('Publisher', $serializer, $em);
        $source = $this->serializeEntity('Source', $serializer, $em);
        $srcType = $this->serializeEntity('SourceType', $serializer, $em);

        $response = new JsonResponse();
        $response->setData(array( 
            'author' => $author,        'citation' => $citation,
            'source' => $source,        'citationType' => $citType, 
            'sourceType' => $srcType,   'publication' => $publication,  
            'publicationType' => $pubType, 'publisher' => $publisher
        ));
        return $response;
    }
    /**
     * Returns serialized data objects for Interaction and Interaction Type. 
     *
     * @Route("/interaction", name="app_serialize_interactions")
     */
    public function serializeInteractionDataAction(Request $request) 
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }  
        $em = $this->getDoctrine()->getManager();
        $serializer = $this->container->get('jms_serializer');

        $interaction = $this->serializeEntity('Interaction', $serializer, $em);
        $intType = $this->serializeEntity('InteractionType', $serializer, $em);
        $tag = $this->serializeEntity('Tag', $serializer, $em);

        $response = new JsonResponse();
        $response->setData(array(
            'interaction' => $interaction,  'interactionType' => $intType,
            'tag' => $tag
        ));
        return $response;
    }
    /**
     * Gets all UserNamed entities created by the current user.
     * @Route("/lists", name="app_serialize_user_named")
     */
    public function getUserLists(Request $request)
    {    
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }           
        $em = $this->getDoctrine()->getManager();

        $lists = $em->getRepository('AppBundle:UserNamed')
            ->findBy(['createdBy' => $this->getUser()]);

        $returnData = [];

        foreach ($lists as $list) {
            array_push($returnData, $this->container->get('jms_serializer')
                ->serialize($list, 'json'));
        }

        $response = new JsonResponse();
        $response->setData(array(
            'lists' => $returnData
        ));
        return $response;
    }
    /** Returns serialized Entity data. */
    private function serializeEntity($entity, $serializer, $em)
    {
        $entities = $em->getRepository('AppBundle:'.$entity)->findAll();
        $data = new \stdClass;   

        for ($i=0; $i < count($entities); $i++) { 
            $entity = $entities[$i];
            $id = $entity->getId();                                             //print('id = '.$id."\n"); 
            $data->$id = $serializer->serialize($entity, 'json');
        }
        return $data;

    }
}