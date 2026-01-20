/** @module @category UI */
import React, { useMemo } from 'react';
import classNames from 'classnames';
import { InlineLoading } from '@carbon/react';
import { type CoreTranslationKey, getCoreTranslation, usePatient } from '@openmrs/esm-framework';
import { usePatientContactAttributes, usePatientAttributes } from './usePatientAttributes';
import styles from './patient-banner-details.scss';

interface ContactDetailsProps {
  patientId: string;
  deceased: boolean;
}

const Address: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { patient, isLoading } = usePatient(patientId);
  const address = patient?.address?.find((a) => a.use === 'home');
  const getAddressKey = (url: string) => url.split('#')[1];

  if (isLoading) {
    return <InlineLoading description={`${getCoreTranslation('loading', 'Loading')} ...`} role="progressbar" />;
  }

  const getAddressParts = () => {
    if (!address) return [];

    const parts: Array<{ label: string; value: string }> = [];

    if (address.state) {
      parts.push({
        label: getCoreTranslation('state' as CoreTranslationKey, 'State'),
        value: address.state,
      });
    }

    const address1 = address.extension?.[0]?.extension?.find((add) => getAddressKey(add.url) === 'address1');
    if (address1?.valueString) {
      parts.push({
        label: getCoreTranslation(getAddressKey(address1.url) as CoreTranslationKey, 'Region'),
        value: address1.valueString,
      });
    }

    if (address.district) {
      parts.push({
        label: getCoreTranslation('district' as CoreTranslationKey, 'District'),
        value: address.district,
      });
    }

    const address2 = address.extension?.[0]?.extension?.find((add) => getAddressKey(add.url) === 'address2');
    if (address2?.valueString) {
      parts.push({
        label: getCoreTranslation(getAddressKey(address2.url) as CoreTranslationKey, 'Township'),
        value: address2.valueString,
      });
    }

    const address3 = address.extension?.[0]?.extension?.find((add) => getAddressKey(add.url) === 'address3');
    if (address3?.valueString) {
      parts.push({
        label: getCoreTranslation(getAddressKey(address3.url) as CoreTranslationKey, 'Fokontany'),
        value: address3.valueString,
      });
    }

    return parts;
  };

  const addressParts = getAddressParts();

  return (
    <>
      <p className={styles.heading}>{getCoreTranslation('address', 'Address')}</p>
      <ul>
        {addressParts.length > 0 ? (
          addressParts.map((part, index) => (
            <li key={`address-part-${index}`}>
              {part.label}: {part.value}
            </li>
          ))
        ) : (
          <li>--</li>
        )}
      </ul>
    </>
  );
};

const Contact: React.FC<{ patientUuid: string; deceased?: boolean }> = ({ patientUuid }) => {
  const { isLoading: isLoadingAttributes, contactAttributes } = usePatientContactAttributes(patientUuid);
  const contacts = useMemo(
    () =>
      contactAttributes
        ? [
            ...contactAttributes?.map((contact) => [
              contact.attributeType.display
                ? getCoreTranslation(
                    /** TODO: We should probably add translation strings for some of these */
                    contact.attributeType.display as CoreTranslationKey,
                    contact.attributeType.display,
                  )
                : '',
              contact.value,
            ]),
          ]
        : [],
    [contactAttributes],
  );

  return (
    <>
      <p className={styles.heading}>{getCoreTranslation('contactDetails', 'Contact Details')}</p>
      {isLoadingAttributes ? (
        <InlineLoading description={`${getCoreTranslation('loading', 'Loading')} ...`} role="progressbar" />
      ) : (
        <ul>
          {contacts.length ? (
            contacts.map(([label, value], index) => (
              <li key={`${label}-${value}-${index}`}>
                {label}: {value}
              </li>
            ))
          ) : (
            <li>--</li>
          )}
        </ul>
      )}
    </>
  );
};

const ContactSection: React.FC<{
  patientUuid: string;
  contactType: 'Accompanying contact' | 'Trusted contact' | 'Emergency contact';
  heading: string;
}> = ({ patientUuid, contactType, heading }) => {
  const { isLoading: isLoadingAttributes, attributes } = usePatientAttributes(patientUuid);

  let contactData = null;
  if (attributes) {
    const filteredAttributes = attributes.filter((attribute) => {
      const displayName = attribute.attributeType?.display || attribute.attributeType?.name || '';
      return displayName.toLowerCase().startsWith(contactType.toLowerCase());
    });

    if (filteredAttributes.length > 0) {
      const nameAttr = filteredAttributes.find((attr) => {
        const displayName = attr.attributeType?.display || attr.attributeType?.name || '';
        return displayName.toLowerCase().includes('name');
      });
      const phoneAttr = filteredAttributes.find((attr) => {
        const displayName = attr.attributeType?.display || attr.attributeType?.name || '';
        return displayName.toLowerCase().includes('phone');
      });
      const relationAttr = filteredAttributes.find((attr) => {
        const displayName = attr.attributeType?.display || attr.attributeType?.name || '';
        return displayName.toLowerCase().includes('relation');
      });

      contactData = {
        name: nameAttr?.value || '--',
        phone: phoneAttr?.value || '--',
        relation: relationAttr?.value || '--',
      };
    }
  }

  return (
    <>
      <p className={styles.heading}>{heading}</p>
      {isLoadingAttributes ? (
        <InlineLoading description={`${getCoreTranslation('loading', 'Loading')} ...`} role="progressbar" />
      ) : (
        <ul>
          {contactData ? (
            <>
              <li>Nom: {contactData.name}</li>
              <li>Téléphone: {contactData.phone}</li>
              <li>Relation: {contactData.relation}</li>
            </>
          ) : (
            <li>--</li>
          )}
        </ul>
      )}
    </>
  );
};

const AccompanyingContact: React.FC<{ patientUuid: string }> = ({ patientUuid }) => {
  return (
    <ContactSection patientUuid={patientUuid} contactType="Accompanying contact" heading="Personne accompagnante" />
  );
};

const TrustedContact: React.FC<{ patientUuid: string }> = ({ patientUuid }) => {
  return <ContactSection patientUuid={patientUuid} contactType="Trusted contact" heading="Personne de confiance" />;
};

const EmergencyContact: React.FC<{ patientUuid: string }> = ({ patientUuid }) => {
  return <ContactSection patientUuid={patientUuid} contactType="Emergency contact" heading="Contact d'urgence" />;
};

export default function PatientBannerContactDetails({ patientId, deceased }: ContactDetailsProps) {
  return (
    <div
      className={classNames(styles.contactDetails, {
        [styles.deceased]: deceased,
      })}
    >
      <div className={styles.row}>
        <div className={styles.col}>
          <Address patientId={patientId} />
        </div>
        <div className={styles.col}>
          <Contact patientUuid={patientId} />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.col}>
          <AccompanyingContact patientUuid={patientId} />
        </div>
        <div className={styles.col}>
          <TrustedContact patientUuid={patientId} />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.col}>
          <EmergencyContact patientUuid={patientId} />
        </div>
      </div>
    </div>
  );
}
