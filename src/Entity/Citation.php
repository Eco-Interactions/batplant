<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Gedmo\Mapping\Annotation as Gedmo;
use JMS\Serializer\Annotation as JMS;
use JMS\Serializer\Annotation\Groups;

/**
 * Citation.
 *
 * @ORM\Table(name="citation")
 * @ORM\Entity
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @JMS\ExclusionPolicy("all")
 */
class Citation
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="display_name", type="string", length=255, nullable=false, unique=true)
     * @JMS\Expose
     * @JMS\SerializedName("displayName")
     * @Groups({"normalized", "flattened"})
     */
    private $displayName;

    /**
     * @var string
     *
     * @ORM\Column(name="title", type="string", length=255, nullable=false)
     * @JMS\Expose
     * @Groups({"normalized", "flattened"})
     */
    private $title;

    /**
     * @var string
     *
     * @ORM\Column(name="full_text", type="text", nullable=false)
     * @JMS\Expose
     * @JMS\SerializedName("fullText")
     * @Groups({"normalized", "flattened"})
     */
    private $fullText;

    /**
     * @var string
     *
     * @ORM\Column(name="abstract", type="text", nullable=true)
     * @JMS\Expose
     * @JMS\SerializedName("abstract")
     * @Groups({"normalized", "flattened"})
     */
    private $abstract;

    /**
     * @var string
     *
     * @ORM\Column(name="publication_volume", type="string", length=255, nullable=true)
     * @JMS\Expose
     * @JMS\SerializedName("publicationVolume")
     * @Groups({"normalized", "flattened"})
     */
    private $publicationVolume;

    /**
     * @var string
     *
     * @ORM\Column(name="publication_issue", type="string", length=255, nullable=true)
     * @JMS\Expose
     * @JMS\SerializedName("publicationIssue")
     * @Groups({"normalized", "flattened"})
     */
    private $publicationIssue;

    /**
     * @var string
     *
     * @ORM\Column(name="publication_pages", type="string", length=255, nullable=true)
     * @JMS\Expose
     * @JMS\SerializedName("publicationPages")
     * @Groups({"normalized", "flattened"})
     */
    private $publicationPages;

    /**
     * @var \App\Entity\CitationType
     *
     * @ORM\ManyToOne(targetEntity="App\Entity\CitationType", inversedBy="publication")
     * @ORM\JoinColumn(name="type_id", referencedColumnName="id", nullable=false)
     */
    private $citationType;

    /**
     * @var \Doctrine\Common\Collections\Collection
     *
     * @ORM\OneToOne(targetEntity="App\Entity\Source", inversedBy="citation", cascade={"remove"})
     * @ORM\JoinColumn(name="source_id", referencedColumnName="id", unique=true, nullable=false)
     */
    private $source;

    /**
     * @var \DateTime
     *
     * @Gedmo\Timestampable(on="create")
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * @var User
     *
     * @Gedmo\Blameable(on="create")
     * @ORM\ManyToOne(targetEntity="App\Entity\User")
     * @ORM\JoinColumn(name="created_by", referencedColumnName="id")
     */
    private $createdBy;

    /**
     * @var \DateTime
     *
     * @Gedmo\Timestampable(on="update")
     * @ORM\Column(type="datetime")
     * @JMS\Expose
     * @JMS\SerializedName("serverUpdatedAt")
     * @Groups({"normalized"})
     */
    private $updated;

    /**
     * @var User
     *
     * @Gedmo\Blameable(on="update")
     * @ORM\ManyToOne(targetEntity="App\Entity\User")
     * @ORM\JoinColumn(name="updated_by", referencedColumnName="id")
     */
    private $updatedBy;

    /**
     * @ORM\Column(name="deletedAt", type="datetime", nullable=true)
     */
    private $deletedAt;

    /**
     * Constructor.
     */
    public function __construct()
    {

    }

    /**
     * Get id.
     * @JMS\VirtualProperty
     * @JMS\SerializedName("id")
     * @Groups({"normalized", "flattened"})
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set displayName.
     *
     * @param string $displayName
     *
     * @return Citation
     */
    public function setDisplayName($displayName)
    {
        $this->displayName = $displayName;

        return $this;
    }

    /**
     * Get displayName.
     *
     * @return string
     */
    public function getDisplayName()
    {
        return $this->displayName;
    }

    /**
     * Set title.
     *
     * @param string $title
     *
     * @return Citation
     */
    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    /**
     * Get title.
     *
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Set fullText.
     *
     * @param string $fullText
     *
     * @return Citation
     */
    public function setFullText($fullText)
    {
        $this->fullText = $fullText;

        return $this;
    }

    /**
     * Get fullText.
     *
     * @return string
     */
    public function getFullText()
    {
        return $this->fullText;
    }

    /**
     * Set abstract.
     *
     * @param string $abstract
     *
     * @return Citation
     */
    public function setAbstract($abstract)
    {
        $this->abstract = $abstract;

        return $this;
    }

    /**
     * Get abstract.
     *
     * @return string
     */
    public function getAbstract()
    {
        return $this->abstract;
    }


    /**
     * Set publicationVolume.
     *
     * @param string $publicationVolume
     *
     * @return Citation
     */
    public function setPublicationVolume($publicationVolume)
    {
        $this->publicationVolume = $publicationVolume;

        return $this;
    }

    /**
     * Get publicationVolume.
     *
     * @return string
     */
    public function getPublicationVolume()
    {
        return $this->publicationVolume;
    }

    /**
     * Set publicationIssue.
     *
     * @param string $publicationIssue
     *
     * @return Citation
     */
    public function setPublicationIssue($publicationIssue)
    {
        $this->publicationIssue = $publicationIssue;

        return $this;
    }

    /**
     * Get publicationIssue.
     *
     * @return string
     */
    public function getPublicationIssue()
    {
        return $this->publicationIssue;
    }
    /**
     * Set publicationPages.
     *
     * @param string $publicationPages
     *
     * @return Citation
     */
    public function setPublicationPages($publicationPages)
    {
        $this->publicationPages = $publicationPages;

        return $this;
    }

    /**
     * Get publicationPages.
     *
     * @return string
     */
    public function getPublicationPages()
    {
        return $this->publicationPages;
    }

    /**
     * Set citationType.
     *
     * @param \App\Entity\CitationType $citationType
     *
     * @return Citation
     */
    public function setCitationType(\App\Entity\CitationType $citationType)
    {
        $this->citationType = $citationType;

        return $this;
    }

    /**
     * Get citationType.
     *
     * @return \App\Entity\CitationType
     */
    public function getCitationType()
    {
        return $this->citationType;
    }

    /**
     * Get the Citation Type id and displayName.
     * @JMS\VirtualProperty
     * @JMS\SerializedName("citationType")
     * @Groups({"normalized", "flattened"})
     */
    public function getCitationTypeData()
    {
        if ($this->citationType) {
            return [
                "id" => $this->citationType->getId(),
                "displayName" => $this->citationType->getDisplayName()
            ];
        }
        return null;
    }

    /**
     * Set source.
     *
     * @param \App\Entity\Source $source
     *
     * @return Citation
     */
    public function setSource(\App\Entity\Source $source)
    {
        $this->source = $source;

        return $this;
    }

    /**
     * Get source.
     *
     * @return \App\Entity\Source
     */
    public function getSource()
    {
        return $this->source;
    }

    /**
     * Get the Source id.
     * @JMS\VirtualProperty
     * @JMS\SerializedName("source")
     * @Groups({"normalized"})
     */
    public function getSourceId()
    {
        return $this->source->getId();
    }

    /**
     * Set created datetime.
     *
     * @param \DateTime $createdAt
     *
     * @return Citation
     */
    public function setCreated(\DateTime $createdAt)
    {
        $this->created = $createdAt;

        return $this;
    }

    /**
     * Get created datetime.
     *
     * @return \DateTime
     */
    public function getCreated()
    {
        return $this->created;
    }

    /**
     * Set createdBy user.
     *
     * @param \App\Entity\User $user
     *
     * @return Citation
     */
    public function setCreatedBy(\App\Entity\User $user)
    {
        $this->createdBy = $user;

        return $this;
    }

    /**
     * Get createdBy user.
     *
     * @return \App\Entity\User
     */
    public function getCreatedBy()
    {
        return $this->createdBy;
    }

    /**
     * Set last-updated datetime.
     *
     * @param \DateTime $updatedAt
     *
     * @return Citation
     */
    public function setUpdated(\DateTime $updatedAt)
    {
        $this->updated = $updatedAt;

        return $this;
    }

    /**
     * Get last updated datetime.
     *
     * @return \DateTime
     */
    public function getUpdated()
    {
        return $this->updated;
    }

    /**
     * Set last updated by user.
     *
     * @param \App\Entity\User $user
     */
    public function setUpdatedBy(\App\Entity\User $user)
    {
        $this->updatedBy = $user;

        return $this;
    }

    /**
     * Get last updated by user.
     *
     * @return \App\Entity\User
     */
    public function getUpdatedBy()
    {
        return $this->updatedBy;
    }

    /**
     * Get deleted at.
     *
     * @return \DateTime
     */
    public function getDeletedAt()
    {
        return $this->deletedAt;
    }

    /**
     * Get string representation of object.
     *
     * @return string
     */
    public function __toString()
    {
        return $this->getDisplayName();
    }
}
