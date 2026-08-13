import type { LegalDocument, LegalDocumentId } from './types';

const operator = `Martin Schmied\nDrorygasse 8\n1030 Vienna\nAustria`;
const contact = 'Email: info@bewerbradar.de\nPhone and WhatsApp: +43 660 56695329';

export const enDocuments: Record<LegalDocumentId, LegalDocument> = {
  impressum: {
    title: 'Legal Notice',
    description: 'Provider identification and media disclosure for BewerbRadar Copilot.',
    updated: '13 August 2026',
    sections: [
      { heading: 'Service provider and media owner', paragraphs: [operator] },
      { heading: 'Contact', paragraphs: [contact] },
      { heading: 'Business information', paragraphs: ['Trading name: BewerbRadar', 'Not registered in the Austrian commercial register.'] },
      { heading: 'Editorial purpose', paragraphs: ['BewerbRadar provides digital tools and information for creating, designing and improving application documents and preparing for recruitment processes.'] },
      {
        heading: 'Liability for content and links',
        paragraphs: ['We prepare our content with care but cannot guarantee that it is correct, complete or current. AI-generated suggestions may contain errors and must be reviewed before use.', 'External website operators are solely responsible for their content. We will remove a link after review if we become aware of a specific infringement.'],
      },
      { heading: 'Copyright', paragraphs: ['Our content, design elements and software components are protected by copyright. Rights in content uploaded or created by users remain with the respective rights holder.'] },
      { heading: 'Consumer dispute resolution', paragraphs: ['We are not obliged and are currently not willing to participate in dispute resolution proceedings before a consumer arbitration body. The former EU Online Dispute Resolution platform was discontinued on 20 July 2025.'] },
    ],
  },
  datenschutz: {
    title: 'Privacy Policy',
    description: 'How BewerbRadar processes and protects personal data.',
    updated: '13 August 2026',
    sections: [
      { heading: '1. Controller', paragraphs: [operator, contact] },
      { heading: '2. Scope', paragraphs: ['This policy applies to BewerbRadar Copilot at copilot.bewerbradar.de. Application documents may contain sensitive personal information. Only upload data that is necessary for your application and that you are legally permitted to process.'] },
      {
        heading: '3. Website access and technical operation',
        paragraphs: ['When the website is accessed, IP address, time, URL, referrer, browser, operating system, device information and status codes may be processed. This supports delivery, stability, troubleshooting and abuse prevention.', 'The legal basis is our legitimate interest in a secure and functional service under Article 6(1)(f) GDPR. Security and access logs are kept only as long as needed for operation and abuse prevention. Relevant data may be retained longer for a specific security incident.'],
      },
      {
        heading: '4. Account and sign-in',
        paragraphs: ['We process email address, name, profile image, internal user identifier, authentication method and session information. Google sign-in supplies profile data released by the user. Email sign-in uses the email address and a time-limited token.', 'Processing is required to operate the account under Article 6(1)(b) GDPR. Essential authentication cookies secure the session.'],
      },
      {
        heading: '5. Resumes, application data and editor',
        paragraphs: ['We store resumes, sections, contact details, work history, education, skills, settings and other account content for editing, storage, preview and export.', 'Uploaded PDF and image files are processed in memory for import and are not permanently stored as original files. Extracted content is stored as resume data after confirmation.', 'The legal basis is Article 6(1)(b) GDPR. Data generally remains until the relevant content or account is deleted. Deletion requests may be sent to info@bewerbradar.de. Statutory retention duties remain unaffected.'],
      },
      {
        heading: '6. AI features',
        paragraphs: ['For imports, writing assistance, cover letters, job matching, translation, mock interviews and other AI features, required content is sent to the selected AI provider. Server-funded features use Google Gemini. A personal API key can select providers such as Google Gemini, OpenAI or Anthropic.', 'Depending on the feature, resume text, job descriptions, instructions, interview content or images may be processed. API keys are stored in the browser and transmitted through our server for the request. They are not stored in our database.', 'The legal basis is Article 6(1)(b) GDPR. AI output is assistance only. BewerbRadar does not make decisions producing legal or similarly significant effects about users.'],
      },
      { heading: '7. Analysis history and mock interviews', paragraphs: ['Job analyses, grammar checks, chats, interview questions, answers, scores and reports may be stored so results can be reopened. They remain until the related content or account is deleted.'] },
      { heading: '8. Public share links', paragraphs: ['Eligible users can share resumes through a public link and may add password protection. Anyone with the link and, if applicable, the password can access the data. Views may be counted. The user controls activation, content and recipients and can disable sharing.'] },
      {
        heading: '9. Subscriptions and Stripe',
        paragraphs: ['Stripe processes payments and subscriptions. Contact, payment, transaction, invoice, customer and subscription data may be sent to Stripe. BewerbRadar does not store full card details.', 'Legal bases include Article 6(1)(b), (c) and (f) GDPR. Tax and billing records may be retained for up to seven years or longer while proceedings remain pending.'],
      },
      {
        heading: '10. Email, phone and WhatsApp contact',
        paragraphs: ['When you contact us, we process contact details and message content under Article 6(1)(b) or (f) GDPR.', 'WhatsApp is also subject to its provider privacy terms. Do not send resumes, API keys, payment details or other highly confidential information through WhatsApp. Prefer email for such matters.'],
      },
      {
        heading: '11. Cookies, browser storage and analytics',
        paragraphs: ['Essential cookies and browser storage support sign-in, security, language, display, settings and initiated actions. Personal API keys and provider settings remain in the browser but are transmitted to our server when an AI request is made.', 'Google Tag Manager manages technical tags. Optional usage analytics is activated only after consent. Advertising storage and personalised advertising remain disabled. Consent can be changed through Cookie Settings. Optional analytics relies on Article 6(1)(a) GDPR.'],
      },
      {
        heading: '12. Recipients and processors',
        paragraphs: ['Depending on the feature, data may be processed by the following recipients:'],
        bullets: ['Hostinger for VPS hosting, infrastructure and email delivery', 'Google for sign-in, Gemini AI, Google Tag Manager and consented analytics', 'Stripe for payments, subscriptions, invoices and fraud prevention', 'OpenAI or Anthropic when selected with a personal API key', 'Authorities, courts or advisers where required by law or needed for legal claims'],
      },
      { heading: '13. International transfers', paragraphs: ['Providers or subprocessors may process data outside the EEA, particularly in the United States. Where required, transfers rely on an adequacy decision, the EU-US Data Privacy Framework, EU Standard Contractual Clauses or another permitted safeguard.'] },
      {
        heading: '14. Retention and deletion',
        paragraphs: ['We retain data only as long as required for the account, contract, functions, security and legal obligations. Account content generally remains until deleted by the user or a deletion request is made. Data may temporarily remain in backups until overwritten in the normal cycle.', 'A deletion request does not automatically cancel a Stripe subscription. The subscription must also be cancelled through the billing portal. Data subject to statutory retention is restricted until the period expires.'],
      },
      {
        heading: '15. Your rights',
        paragraphs: ['Subject to the GDPR, you have rights including access, rectification, erasure, restriction, portability and objection. Consent may be withdrawn at any time for the future. Contact info@bewerbradar.de.', 'You may complain to a data protection authority. The Austrian authority is the Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Vienna, dsb.gv.at.'],
      },
      { heading: '16. Security and changes', paragraphs: ['We use technical and organisational safeguards. No online service can guarantee absolute security. This policy will be updated when functions, providers or applicable law materially change.'] },
    ],
  },
  agb: {
    title: 'Terms of Service',
    description: 'Terms for BewerbRadar Copilot and paid subscriptions.',
    updated: '13 August 2026',
    sections: [
      { heading: '1. Provider and scope', paragraphs: [`These terms apply to BewerbRadar Copilot, provided by:\n${operator}\n${contact}`, 'They apply to free and paid use by consumers and businesses. Mandatory consumer rights remain unaffected.'] },
      { heading: '2. Service', paragraphs: ['BewerbRadar provides a web-based resume editor, templates, import and export, AI-assisted writing and analysis, mock interviews and optional share links. The specific scope depends on the plan displayed at purchase.', 'AI features are not personal, legal or professional advice and do not guarantee ATS compatibility, interviews, application success or employment.'] },
      { heading: '3. Account and access', paragraphs: ['Key functions require an account using Google or an email link. Users must provide correct contact information and protect account access. Abuse, automation and circumvention of plan limits are prohibited.', 'The service is intended for users aged 18 or older. Minors require valid consent from their legal representatives.'] },
      { heading: '4. Free use and personal API keys', paragraphs: ['Free features and limits are described in the current plan presentation and do not create an entitlement to permanent unchanged availability.', 'A personal API key is also subject to the selected provider terms and pricing. The user is responsible for key security, permission and provider billing.'] },
      { heading: '5. Subscriptions, prices and payment', paragraphs: ['Paid plans are offered monthly or annually. The scope, billing period and total price shown immediately before the paid order are decisive.', 'Stripe processes payment. A subscription begins after payment confirmation and renews for the selected period until cancelled. Invoice and tax details are those shown in checkout and on the receipt.'] },
      { heading: '6. Contract formation', paragraphs: ['The plan presentation invites an order. The user selects a plan and period and proceeds to Stripe Checkout. A binding offer is submitted through the clearly labelled paid order process. The contract is formed when payment is confirmed and the plan is activated.'] },
      { heading: '7. Term and cancellation', paragraphs: ['Subscriptions can be cancelled at any time through the linked Stripe customer portal. Cancellation stops renewal. The plan generally remains available until the end of the paid period.', 'Deleting resumes, signing out or requesting account deletion does not cancel a subscription.'] },
      { heading: '8. Right of withdrawal', paragraphs: ['Consumers generally have a statutory 14-day right of withdrawal. Details and a model form are available on the Withdrawal page. Cancellation and statutory withdrawal are different declarations.', 'Where a consumer expressly requests performance during the withdrawal period, proportionate payment for service supplied before withdrawal may be due where legally permitted.'] },
      {
        heading: '9. User content and duties',
        paragraphs: ['Users retain rights in their content and grant BewerbRadar only the rights needed for processing, storage, output and requested sharing.'],
        bullets: ['Only content supported by sufficient rights and legal grounds may be processed.', 'Illegal, harmful, deceptive or abusive conduct is prohibited.', 'Resumes and AI output must be checked before use.', 'Public share links must respect the rights of affected persons.'],
      },
      { heading: '10. AI output', paragraphs: ['Generative AI may produce inaccurate, incomplete or fabricated output. BewerbRadar provides the function, not a specific application outcome. Users choose which suggestions to adopt and remain responsible for final documents.'] },
      { heading: '11. Availability and changes', paragraphs: ['We aim for reliable availability but do not promise uninterrupted use. Maintenance, security measures, external providers and force majeure may temporarily restrict functions.', 'Functions may be improved provided the contractual purpose and essential paid benefits are not unreasonably impaired. Material adverse changes will be communicated in advance.'] },
      { heading: '12. Suspension and termination', paragraphs: ['Access may be suspended or terminated for cause after review in cases of material abuse, attacks, limit circumvention, infringement or payment default. Legitimate consumer claims will be respected.'] },
      { heading: '13. Warranty and liability', paragraphs: ['Statutory warranty rights apply. For ordinary negligence outside personal injury, liability is limited to breach of essential contractual duties and foreseeable typical damage. Liability for intent, gross negligence, personal injury, product liability and mandatory consumer rights remains unrestricted.', 'For decisions, content and charges of a self-selected third-party provider, we are liable only to the extent that we culpably caused the damage.'] },
      { heading: '14. Privacy', paragraphs: ['The Privacy Policy explains processing of personal data, AI providers, Stripe, hosting, analytics and public sharing.'] },
      { heading: '15. Governing law and dispute resolution', paragraphs: ['Austrian law applies. For consumers, this choice applies only insofar as it does not remove mandatory protection under the law of their habitual residence.', 'We are not obliged and are currently not willing to participate in dispute resolution proceedings before a consumer arbitration body.'] },
      { heading: '16. Contact', paragraphs: ['Questions, complaints, cancellation notices and legal declarations may be sent to info@bewerbradar.de.'] },
    ],
  },
  widerruf: {
    title: 'Withdrawal Information',
    description: 'Information about the statutory withdrawal right for consumers.',
    updated: '13 August 2026',
    sections: [
      { heading: 'Right of withdrawal', paragraphs: ['Consumers may withdraw from this contract within 14 days without giving a reason. The period is 14 days from contract conclusion.', `To exercise the right, inform us at:\n\n${operator}\n${contact}\n\nAn unambiguous statement, for example by email, is sufficient. The model is optional. Sending it before the deadline preserves the period.`] },
      { heading: 'Effects of withdrawal', paragraphs: ['If you withdraw, we will reimburse all payments received for the withdrawn contract without undue delay and no later than 14 days after receiving your notice. We normally use the original payment method.', 'If you expressly requested performance during the withdrawal period, a proportionate amount for service already supplied may be payable where the statutory conditions are met.'] },
      { heading: 'Model withdrawal form', paragraphs: [`To Martin Schmied, Drorygasse 8, 1030 Vienna, Austria, email: info@bewerbradar.de\n\nI hereby withdraw from the contract I concluded for the use of BewerbRadar Copilot.\n\nOrdered on:\nConsumer name:\nConsumer address:\nAccount email address:\nDate:\nSignature, only for notice on paper:`] },
      { heading: 'Cancellation is different from withdrawal', paragraphs: ['A subscription can be cancelled for the future at any time through the Stripe customer portal. Withdrawal concerns the original contract within the statutory period and must be declared unambiguously.'] },
    ],
  },
};
