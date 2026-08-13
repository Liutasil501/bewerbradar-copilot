import type { LegalDocument, LegalDocumentId } from './types';

const operator = `Martin Schmied\nDrorygasse 8\n1030 Wien\nÖsterreich`;
const contact = 'E-Mail: info@bewerbradar.de\nWhatsApp: +66956685329';

export const deDocuments: Record<LegalDocumentId, LegalDocument> = {
  impressum: {
    title: 'Impressum',
    description: 'Anbieterkennzeichnung und Offenlegung für BewerbRadar Copilot.',
    updated: '13. August 2026',
    sections: [
      { heading: 'Diensteanbieter und Medieninhaber', paragraphs: [operator] },
      { heading: 'Kontakt', paragraphs: [contact] },
      {
        heading: 'Unternehmensangaben',
        paragraphs: ['Geschäftsbezeichnung: BewerbRadar', 'Nicht im Firmenbuch eingetragen.'],
      },
      {
        heading: 'Grundlegende Richtung des Mediums',
        paragraphs: ['BewerbRadar stellt digitale Werkzeuge und Informationen zur Erstellung, Gestaltung und Verbesserung von Bewerbungsunterlagen sowie zur Vorbereitung auf Bewerbungsverfahren bereit.'],
      },
      {
        heading: 'Haftung für Inhalte und Links',
        paragraphs: [
          'Die Inhalte werden sorgfältig erstellt. Eine Gewähr für Richtigkeit, Vollständigkeit und Aktualität kann dennoch nicht übernommen werden. KI-generierte Vorschläge können fehlerhaft sein und müssen vor Verwendung eigenständig geprüft werden.',
          'Für Inhalte externer Websites sind ausschließlich deren Betreiber verantwortlich. Wenn uns eine konkrete Rechtsverletzung bekannt wird, entfernen wir den betreffenden Link nach Prüfung unverzüglich.',
        ],
      },
      {
        heading: 'Urheberrecht',
        paragraphs: ['Eigene Inhalte, Gestaltungselemente und Softwarebestandteile sind urheberrechtlich geschützt. Rechte an vom Nutzer hochgeladenen oder erstellten Inhalten verbleiben beim jeweiligen Rechteinhaber.'],
      },
      {
        heading: 'Verbraucherstreitbeilegung',
        paragraphs: ['Wir sind nicht verpflichtet und derzeit nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Die frühere EU-Plattform zur Online-Streitbeilegung wurde am 20. Juli 2025 eingestellt.'],
      },
    ],
  },
  datenschutz: {
    title: 'Datenschutzerklärung',
    description: 'Wie BewerbRadar personenbezogene Daten verarbeitet und schützt.',
    updated: '13. August 2026',
    sections: [
      { heading: '1. Verantwortlicher', paragraphs: [operator, contact] },
      {
        heading: '2. Geltungsbereich',
        paragraphs: ['Diese Datenschutzerklärung gilt für BewerbRadar Copilot unter copilot.bewerbradar.de. Bewerbungsunterlagen können sensible persönliche Informationen enthalten. Laden Sie nur Daten hoch, die für Ihre Bewerbung erforderlich sind und die Sie rechtmäßig verarbeiten dürfen.'],
      },
      {
        heading: '3. Websitezugriff und technischer Betrieb',
        paragraphs: [
          'Beim Aufruf können IP-Adresse, Zeitpunkt, URL, Referrer, Browser, Betriebssystem, Geräteinformationen und Statuscodes verarbeitet werden. Dies dient Bereitstellung, Stabilität, Fehleranalyse und Missbrauchsabwehr.',
          'Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und funktionsfähigen Dienst gemäß Art. 6 Abs. 1 lit. f DSGVO. Sicherheits- und Zugriffsprotokolle werden nur so lange gespeichert, wie sie für Betrieb und Missbrauchsabwehr erforderlich sind. Bei einem konkreten Vorfall können relevante Daten länger aufbewahrt werden.',
        ],
      },
      {
        heading: '4. Konto und Anmeldung',
        paragraphs: [
          'Wir verarbeiten insbesondere E-Mail-Adresse, Namen, Profilbild, interne Benutzerkennung, Authentifizierungsart und Sitzungsinformationen. Bei Google-Anmeldung erhalten wir die freigegebenen Profildaten. Beim E-Mail-Login verarbeiten wir die E-Mail-Adresse und einen zeitlich begrenzten Anmeldetoken.',
          'Rechtsgrundlage ist die Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO. Technisch notwendige Authentifizierungs-Cookies sichern die Sitzung.',
        ],
      },
      {
        heading: '5. Lebensläufe, Bewerbungsdaten und Editor',
        paragraphs: [
          'Wir speichern die im Konto angelegten Lebensläufe, Abschnitte, Kontaktdaten, Berufserfahrung, Ausbildung, Fähigkeiten, Einstellungen und weitere Inhalte für Bearbeitung, Speicherung, Vorschau und Export.',
          'Hochgeladene PDF- und Bilddateien werden für den Import im Arbeitsspeicher verarbeitet und nicht als ursprüngliche Datei dauerhaft gespeichert. Extrahierte Inhalte werden nach Bestätigung als Lebenslaufdaten gespeichert.',
          'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Daten verbleiben grundsätzlich bis zur Löschung des Inhalts oder Kontos. Löschungsanfragen können an info@bewerbradar.de gerichtet werden. Gesetzliche Aufbewahrungspflichten bleiben unberührt.',
        ],
      },
      {
        heading: '6. KI-Funktionen',
        paragraphs: [
          'Für Import, Textverbesserung, Anschreiben, Stellenabgleich, Übersetzung, Probe-Interviews und weitere KI-Funktionen werden erforderliche Inhalte an den ausgewählten KI-Anbieter übermittelt. Serverfinanzierte Funktionen verwenden Google Gemini. Mit eigenem API-Schlüssel kann der Nutzer beispielsweise Google Gemini, OpenAI oder Anthropic auswählen.',
          'Je nach Funktion können Lebenslauftext, Stellenbeschreibung, Anweisungen, Gesprächsinhalte oder Bilder verarbeitet werden. API-Schlüssel werden im Browser gespeichert und für die Anfrage über unseren Server übertragen. Sie werden nicht in unserer Datenbank gespeichert.',
          'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. KI-Ergebnisse sind Unterstützung. BewerbRadar trifft keine automatisierten Entscheidungen mit rechtlicher oder vergleichbar erheblicher Wirkung über Nutzer.',
        ],
      },
      {
        heading: '7. Analyseverläufe und Probe-Interviews',
        paragraphs: ['Stellenanalysen, Grammatikprüfungen, Chatverläufe, Interviewfragen, Antworten, Bewertungen und Berichte können im Konto gespeichert werden, damit Ergebnisse erneut aufgerufen werden können. Sie bleiben bis zur Löschung des zugehörigen Inhalts oder Kontos gespeichert.'],
      },
      {
        heading: '8. Öffentliche Freigabelinks',
        paragraphs: ['Berechtigte Nutzer können Lebensläufe über einen öffentlichen Link freigeben und optional mit einem Passwort schützen. Wer über Link und gegebenenfalls Passwort verfügt, kann die Daten abrufen. Aufrufe können gezählt werden. Der Nutzer kontrolliert Aktivierung, Inhalt und Empfänger und kann die Freigabe deaktivieren.'],
      },
      {
        heading: '9. Abonnements und Stripe',
        paragraphs: [
          'Zahlungen und Abonnements werden durch Stripe verarbeitet. Kontakt-, Zahlungs-, Transaktions-, Rechnungs-, Kunden- und Abonnementdaten können an Stripe übermittelt werden. Vollständige Kartendaten werden nicht von BewerbRadar gespeichert.',
          'Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b, c und f DSGVO. Steuer- und abrechnungsrelevante Unterlagen können entsprechend gesetzlicher Pflichten bis zu sieben Jahre oder bei anhängigen Verfahren länger gespeichert werden.',
        ],
      },
      {
        heading: '10. Kontakt per E-Mail, Telefon oder WhatsApp',
        paragraphs: [
          'Bei einer Kontaktaufnahme verarbeiten wir Kontaktdaten und Nachricht zur Bearbeitung der Anfrage gemäß Art. 6 Abs. 1 lit. b oder f DSGVO.',
          'Bei WhatsApp gelten zusätzlich die Datenschutzbedingungen des Anbieters. Übermitteln Sie dort keine Lebensläufe, API-Schlüssel, Zahlungsdaten oder andere besonders vertrauliche Informationen. Nutzen Sie dafür vorzugsweise E-Mail.',
        ],
      },
      {
        heading: '11. Cookies, Browser-Speicher und Nutzungsanalyse',
        paragraphs: [
          'Notwendige Cookies und Browser-Speicher unterstützen Anmeldung, Sicherheit, Sprache, Darstellung, Einstellungen und begonnene Aktionen. Eigene API-Schlüssel und Provider-Einstellungen bleiben im Browser, werden bei einer KI-Anfrage aber an unseren Server übertragen.',
          'Google Tag Manager verwaltet technische Tags. Optionale Nutzungsanalyse wird nur nach Einwilligung aktiviert. Werbespeicherung und personalisierte Werbung bleiben deaktiviert. Die Entscheidung kann über die Cookie-Einstellungen geändert werden. Rechtsgrundlage optionaler Analyse ist Art. 6 Abs. 1 lit. a DSGVO.',
        ],
      },
      {
        heading: '12. Empfänger und Auftragsverarbeiter',
        paragraphs: ['Abhängig von der verwendeten Funktion können insbesondere folgende Empfänger Daten verarbeiten:'],
        bullets: [
          'Hostinger für VPS-Hosting, Infrastruktur und E-Mail-Versand',
          'Google für Anmeldung, Gemini-KI, Google Tag Manager und eingewilligte Analysefunktionen',
          'Stripe für Zahlungen, Abonnements, Rechnungen und Betrugsprävention',
          'OpenAI oder Anthropic, wenn der Nutzer diese mit eigenem API-Schlüssel auswählt',
          'Behörden, Gerichte oder Berater bei gesetzlicher Pflicht oder zur Durchsetzung von Rechtsansprüchen',
        ],
      },
      {
        heading: '13. Drittländer',
        paragraphs: ['Dienstleister oder Unterauftragnehmer können Daten außerhalb des EWR verarbeiten, insbesondere in den USA. Übermittlungen erfolgen, soweit erforderlich, auf Grundlage eines Angemessenheitsbeschlusses, des EU-US Data Privacy Framework, von EU-Standardvertragsklauseln oder anderer zulässiger Garantien.'],
      },
      {
        heading: '14. Speicherdauer und Löschung',
        paragraphs: [
          'Wir speichern Daten nur so lange, wie es für Konto, Vertrag, Funktionen, Sicherheit und gesetzliche Pflichten notwendig ist. Kontoinhalte bleiben grundsätzlich bis zur Löschung durch den Nutzer oder einer Löschungsanfrage gespeichert. Daten können vorübergehend in Sicherungskopien verbleiben, bis diese turnusmäßig überschrieben werden.',
          'Eine Löschungsanfrage beendet nicht automatisch ein Stripe-Abonnement. Dieses muss zusätzlich über das Abrechnungsportal gekündigt werden. Gesetzlich aufzubewahrende Daten werden bis zum Fristablauf gesperrt.',
        ],
      },
      {
        heading: '15. Ihre Rechte',
        paragraphs: [
          'Sie haben nach Maßgabe der DSGVO insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Eine Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden. Schreiben Sie dazu an info@bewerbradar.de.',
          'Sie können Beschwerde bei einer Datenschutzaufsichtsbehörde einreichen. In Österreich ist dies die Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Wien, dsb.gv.at.',
        ],
      },
      {
        heading: '16. Sicherheit und Änderungen',
        paragraphs: ['Wir setzen technische und organisatorische Schutzmaßnahmen ein. Kein Online-Dienst kann absolute Sicherheit garantieren. Diese Erklärung wird angepasst, wenn sich Funktionen, Anbieter oder Rechtslage wesentlich ändern.'],
      },
    ],
  },
  agb: {
    title: 'Nutzungsbedingungen',
    description: 'Bedingungen für BewerbRadar Copilot und kostenpflichtige Abonnements.',
    updated: '13. August 2026',
    sections: [
      {
        heading: '1. Anbieter und Geltungsbereich',
        paragraphs: [`Diese Bedingungen gelten für BewerbRadar Copilot, angeboten von:\n${operator}\n${contact}`, 'Sie gelten für kostenlose und kostenpflichtige Nutzung durch Verbraucher und Unternehmer. Zwingende Verbraucherschutzrechte bleiben unberührt.'],
      },
      {
        heading: '2. Leistungsumfang',
        paragraphs: [
          'BewerbRadar stellt einen webbasierten Lebenslauf-Editor, Vorlagen, Import- und Exportfunktionen, KI-gestützte Text- und Analysefunktionen, Probe-Interviews sowie optionale Freigabelinks bereit. Der konkrete Umfang richtet sich nach dem beim Abschluss angezeigten Tarif.',
          'KI-Funktionen ersetzen keine persönliche, rechtliche oder professionelle Beratung und garantieren weder ATS-Kompatibilität noch Einladungen, Bewerbungs- oder Einstellungserfolge.',
        ],
      },
      {
        heading: '3. Konto und Zugang',
        paragraphs: ['Wesentliche Funktionen erfordern ein Konto über Google oder E-Mail-Link. Nutzer müssen richtige Kontaktdaten verwenden und ihre Zugänge schützen. Missbrauch, Automatisierung und Umgehung von Tarifgrenzen sind unzulässig.', 'Die Nutzung ist Personen ab 18 Jahren gestattet. Minderjährige benötigen die wirksame Zustimmung ihrer gesetzlichen Vertreter.'],
      },
      {
        heading: '4. Kostenlose Nutzung und eigene API-Schlüssel',
        paragraphs: ['Kostenlose Funktionen und Limits ergeben sich aus der aktuellen Tarifdarstellung und begründen keinen Anspruch auf unveränderte dauerhafte Bereitstellung.', 'Bei einem eigenen API-Schlüssel gelten zusätzlich Bedingungen und Preise des ausgewählten KI-Anbieters. Der Nutzer ist für Schutz, Berechtigung und Abrechnung seines Schlüssels verantwortlich.'],
      },
      {
        heading: '5. Abonnements, Preise und Zahlung',
        paragraphs: ['Kostenpflichtige Tarife werden monatlich oder jährlich angeboten. Maßgeblich sind Leistungsumfang, Abrechnungszeitraum und Gesamtpreis, die unmittelbar vor der zahlungspflichtigen Bestellung angezeigt werden.', 'Stripe wickelt die Zahlung ab. Das Abonnement beginnt nach erfolgreicher Zahlungsbestätigung und verlängert sich um den gewählten Zeitraum, bis es gekündigt wird. Rechnungs- und Steuerangaben richten sich nach Checkout und Beleg.'],
      },
      {
        heading: '6. Vertragsschluss',
        paragraphs: ['Die Tarifdarstellung lädt zur Bestellung ein. Der Nutzer wählt Tarif und Zeitraum und wird zum Stripe-Checkout geleitet. Mit dem eindeutig als zahlungspflichtig gekennzeichneten Bestellvorgang gibt er ein verbindliches Angebot ab. Der Vertrag kommt mit Zahlungsbestätigung und Freischaltung zustande.'],
      },
      {
        heading: '7. Laufzeit und Kündigung',
        paragraphs: ['Abonnements können jederzeit über das verlinkte Stripe-Kundenportal gekündigt werden. Die Kündigung stoppt die Verlängerung. Der Tarif bleibt grundsätzlich bis zum Ende des bezahlten Zeitraums nutzbar.', 'Das Löschen von Lebensläufen, Abmelden oder eine Kontolöschungsanfrage ersetzt keine Kündigung.'],
      },
      {
        heading: '8. Widerrufsrecht',
        paragraphs: ['Verbraucher haben grundsätzlich ein gesetzliches Widerrufsrecht von 14 Tagen. Einzelheiten und Musterformular stehen auf der Seite Widerrufsbelehrung. Kündigung und gesetzlicher Widerruf sind unterschiedliche Erklärungen.', 'Verlangt ein Verbraucher ausdrücklich den Leistungsbeginn während der Widerrufsfrist, kann im gesetzlich zulässigen Umfang Wertersatz für den bis zum Widerruf erbrachten Anteil anfallen.'],
      },
      {
        heading: '9. Inhalte und Pflichten',
        paragraphs: ['Nutzer behalten ihre Rechte an Inhalten und räumen BewerbRadar nur die für Verarbeitung, Speicherung, Ausgabe und gewünschte Freigabe erforderlichen Rechte ein.'],
        bullets: ['Nur Inhalte mit ausreichenden Rechten und Rechtsgrundlagen dürfen verarbeitet werden.', 'Rechtswidrige, schädliche, täuschende oder missbräuchliche Handlungen sind unzulässig.', 'Lebensläufe und KI-Ergebnisse müssen vor Versand geprüft werden.', 'Öffentliche Freigabelinks müssen bewusst und unter Wahrung fremder Rechte erstellt werden.'],
      },
      {
        heading: '10. KI-Ergebnisse',
        paragraphs: ['Generative KI kann unrichtige, unvollständige oder erfundene Ergebnisse erzeugen. BewerbRadar schuldet die Funktion, nicht einen bestimmten Bewerbungserfolg. Nutzer entscheiden selbst über die Übernahme und verantworten ihre endgültigen Unterlagen.'],
      },
      {
        heading: '11. Verfügbarkeit und Änderungen',
        paragraphs: ['Wir bemühen uns um zuverlässige Verfügbarkeit, schulden aber keine unterbrechungsfreie Nutzung. Wartung, Sicherheitsmaßnahmen, externe Anbieter und höhere Gewalt können Funktionen zeitweise einschränken.', 'Funktionen dürfen weiterentwickelt werden, wenn Vertragszweck und wesentliche bezahlte Leistungen nicht unangemessen beeinträchtigt werden. Wesentliche nachteilige Änderungen werden rechtzeitig mitgeteilt.'],
      },
      {
        heading: '12. Sperrung und Beendigung',
        paragraphs: ['Bei erheblichem Missbrauch, Angriffen, Umgehung technischer Grenzen, Rechtsverletzungen oder Zahlungsrückständen kann der Zugang nach Prüfung gesperrt oder aus wichtigem Grund beendet werden. Berechtigte Verbraucheransprüche werden berücksichtigt.'],
      },
      {
        heading: '13. Gewährleistung und Haftung',
        paragraphs: ['Es gelten die gesetzlichen Gewährleistungsrechte. Bei leichter Fahrlässigkeit haften wir außerhalb von Personenschäden nur bei Verletzung wesentlicher Vertragspflichten und beschränkt auf den vorhersehbaren typischen Schaden. Haftung für Vorsatz, grobe Fahrlässigkeit, Personenschäden, Produkthaftung und zwingende Verbraucherrechte bleibt unbeschränkt.', 'Für Entscheidungen, Inhalte und Kosten selbst gewählter Drittanbieter haften wir nur, soweit wir den Schaden selbst schuldhaft verursacht haben.'],
      },
      { heading: '14. Datenschutz', paragraphs: ['Die Datenschutzerklärung beschreibt die Verarbeitung personenbezogener Daten, KI-Anbieter, Stripe, Hosting, Analyse und öffentliche Freigaben.'] },
      {
        heading: '15. Recht und Streitbeilegung',
        paragraphs: ['Es gilt österreichisches Recht. Bei Verbrauchern gilt diese Wahl nur, soweit sie den Schutz zwingender Bestimmungen des Staates ihres gewöhnlichen Aufenthalts nicht entzieht.', 'Wir sind nicht verpflichtet und derzeit nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'],
      },
      { heading: '16. Kontakt', paragraphs: ['Fragen, Beschwerden, Kündigungshinweise und rechtliche Erklärungen können an info@bewerbradar.de gerichtet werden.'] },
    ],
  },
  widerruf: {
    title: 'Widerrufsbelehrung',
    description: 'Informationen zum gesetzlichen Widerrufsrecht für Verbraucher.',
    updated: '13. August 2026',
    sections: [
      {
        heading: 'Widerrufsrecht',
        paragraphs: ['Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Frist beträgt 14 Tage ab Vertragsabschluss.', `Um Ihr Widerrufsrecht auszuüben, informieren Sie uns unter:\n\n${operator}\n${contact}\n\nDie Erklärung kann beispielsweise per E-Mail erfolgen. Das Muster ist nicht vorgeschrieben. Zur Wahrung der Frist genügt die rechtzeitige Absendung.`],
      },
      {
        heading: 'Folgen des Widerrufs',
        paragraphs: ['Bei einem Widerruf erstatten wir alle für den widerrufenen Vertrag erhaltenen Zahlungen unverzüglich und spätestens binnen 14 Tagen ab Eingang des Widerrufs. Wir verwenden grundsätzlich dasselbe Zahlungsmittel wie bei der ursprünglichen Zahlung.', 'Wurde ausdrücklich ein Leistungsbeginn während der Widerrufsfrist verlangt, kann bei Vorliegen der gesetzlichen Voraussetzungen ein angemessener Betrag für den bereits erbrachten Anteil zu zahlen sein.'],
      },
      {
        heading: 'Muster-Widerrufsformular',
        paragraphs: [`An Martin Schmied, Drorygasse 8, 1030 Wien, Österreich, E-Mail: info@bewerbradar.de\n\nHiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Nutzung von BewerbRadar Copilot.\n\nBestellt am:\nName des Verbrauchers:\nAnschrift des Verbrauchers:\nE-Mail-Adresse des Kontos:\nDatum:\nUnterschrift, nur bei Mitteilung auf Papier:`],
      },
      {
        heading: 'Kündigung ist nicht dasselbe wie Widerruf',
        paragraphs: ['Ein Abonnement kann jederzeit über das Stripe-Kundenportal für die Zukunft gekündigt werden. Ein Widerruf betrifft den Vertragsschluss innerhalb der gesetzlichen Frist und muss eindeutig erklärt werden.'],
      },
    ],
  },
};
