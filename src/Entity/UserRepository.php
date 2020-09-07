<?php

namespace App\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * UserRepository.
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class UserRepository extends EntityRepository
{
    /**
     * @return array
     */
    public function findAdmins()
    {
        $qb = $this->createQueryBuilder('u')
            ->where('u.roles LIKE :roles')
            ->setParameter('roles', '%ADMIN%');

        return $qb->getQuery()->getResult();
    }

    /**
     * @return array
     */
    public function findOnlineNow()
    {
        $qb = $this->createQueryBuilder('u')
            ->where('u.lastActivityAt > :dt')
            ->orderBy('u.username', 'ASC')
            ->setParameter('dt', new \DateTime('-24 hours', new \DateTimeZone('America/Los_Angeles') ));

        return $qb->getQuery()->getResult();
    }

}