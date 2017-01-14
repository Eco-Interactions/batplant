<?php

namespace AppBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;

use AppBundle\Entity\Source;


/**
 * Search Page controller.
 *
 * @Route("/admin/crud")
 */
class CrudController extends Controller
{
    /**
     * Creates a new Source, and any new detail-entities, according to 
     * the submitted form data object. 
     *
     * @Route("/source/create", name="app_crud_source_create")
     */
    public function sourceCreateAction(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('message' => 'You can access this only using Ajax!'), 400);
        }                                                                       //print("\nCreating Source.\n");

        $em = $this->getDoctrine()->getManager();
        $requestContent = $request->getContent();

        $formData = json_decode($requestContent);                               //print("\nForm data =");print_r($formData);
        $srcData = $formData->source;

        if ($srcData->hasDetail) {                                              //print("\nHas Detail.\n");
            $detailEntName = $srcData->sourceType;
            $detailData = $formData->$detailEntName;
            $detailEntClass = 'AppBundle\\Entity\\'. ucfirst($detailEntName);
            $detailEntity = new $detailEntClass();
            $this->setEntityData($detailData, $detailEntity, $em);
        }
        $srcEntity = new Source();
        $this->setEntityData($srcData, $srcEntity, $em);

        print($detailEntity->getDisplayName());

        $response = new JsonResponse();
        $response->setData(array(
            'YouRock' => 'SuperDuper'
        ));
        return $response;
    }
    /**
     * Calls the set method for both types of entity data, flat and relational, 
     * and persists the entity.
     */
    private function setEntityData($formData, &$entity, &$em)
    {
        $this->setFlatData($formData->flat, $entity, $em);
        $em->persist($entity);
    }
    private function setFlatData($formData, &$entity, &$em)
    {
        foreach ($formData as $field => $val) {
            $setField = 'set'. ucfirst($field);
            $entity->$setField($val);
        }

    }

}