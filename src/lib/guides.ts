// Buyer guides. Statute wording is quoted from the Florida Legislature's Online Sunshine site
// (2026 Florida Statutes), read on 20 Nov 2026. Re-read the source before changing any quote.

const FS = (n: string) => `https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.${n}.html`;

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string; cite: string; url: string }
  | { type: 'table'; head: string[]; rows: string[][] };

export type Guide = {
  slug: string; title: string; h1: string; description: string; summary: string; reviewed: string;
  blocks: Block[]; faqs: { q: string; a: string }[]; sources: { label: string; url: string }[];
};

export const NOT_LEGAL_ADVICE = 'This guide is general information, not legal advice. Contracts differ, and the law can change. Before you sign or send money, have a Florida real estate attorney read your documents.';

export const GUIDES: Guide[] = [
  {
    slug: 'florida-pre-construction-deposit-protection',
    title: 'How Florida Pre-Construction Deposits Are Protected',
    h1: 'How Florida pre-construction deposits are protected',
    description: 'Florida law puts the first 10% of a pre-construction condo deposit in escrow with an independent agent. What happens to money above 10%, and what to check.',
    summary: 'When you buy a Florida condo before it is finished, the developer must put your payments, up to 10% of the price, into an escrow account held by an independent escrow agent. Payments above 10% go into a separate escrow account, and the developer can spend that money on construction only if your contract says so in a specific bold-type warning, and only once construction has begun.',
    reviewed: '2026-11-20',
    blocks: [
      { type: 'h', text: 'The first 10% stays in escrow' },
      { type: 'p', text: 'Section 718.202(1) of the Florida Statutes covers a condo sold before construction, furnishing and landscaping are substantially complete. In that case:' },
      { type: 'quote', text: 'the developer shall pay into an escrow account all payments up to 10 percent of the sale price received by the developer from the buyer towards the sale price.', cite: 'Fla. Stat. § 718.202(1)', url: FS('202') },
      { type: 'p', text: 'The escrow agent must give you a receipt if you ask for one. There is one alternative you should know about: for residential condos the state regulator may accept "other assurances" in place of escrow, such as a surety bond or an irrevocable letter of credit for the same amount. Ask which applies to your building.' },
      { type: 'h', text: 'Money above 10% can be used for construction, with a warning' },
      { type: 'p', text: 'Payments beyond the first 10% go into a "special escrow account". Under § 718.202(3), the developer may withdraw that money once construction of improvements has begun, but only "if the contract for sale of the condominium unit so provides", and only for actual construction and development costs. It cannot pay for sales commissions, advertising, loan costs, attorney or accounting fees, or insurance.' },
      { type: 'p', text: 'A contract that allows this must carry the following legend, in boldfaced type, on the first page and again immediately above where you sign:' },
      { type: 'quote', text: 'ANY PAYMENT IN EXCESS OF 10 PERCENT OF THE PURCHASE PRICE MADE TO DEVELOPER PRIOR TO CLOSING PURSUANT TO THIS CONTRACT MAY BE USED FOR CONSTRUCTION PURPOSES BY THE DEVELOPER.', cite: 'Fla. Stat. § 718.202(3)', url: FS('202') },
      { type: 'p', text: 'In plain terms: if you see that legend, the part of your deposit above 10% is not sitting untouched until closing. It is being spent on the building. If the project fails, that money is harder to recover than the escrowed 10%.' },
      { type: 'h', text: 'Who can hold the money' },
      { type: 'p', text: 'Under § 718.202(8), the escrow account must be with a bank, a savings and loan association, a Florida Bar attorney, a registered real estate broker, an authorised title insurer, or a lender with a net worth above $5 million. The statute adds:' },
      { type: 'quote', text: 'Every escrow agent shall be independent of the developer, and no developer or any officer, director, affiliate, subsidiary, or employee of a developer may serve as escrow agent.', cite: 'Fla. Stat. § 718.202(8)', url: FS('202') },
      { type: 'h', text: 'When the money comes back to you' },
      { type: 'list', items: [
        'If you properly end the contract, under its terms or under the Condominium Act, the escrowed funds are paid to you with any interest earned (§ 718.202(1)(a)).',
        'If you default, the funds go to the developer (§ 718.202(1)(b)).',
        'If the developer does not follow this section, the contract is voidable by the buyer, and all sums deposited are refunded with interest (§ 718.202(5)).',
      ] },
      { type: 'h', text: 'What to check before you send a deposit' },
      { type: 'list', items: [
        'The name and address of the escrow agent. Your contract must state it (§ 718.503(1)(a)7).',
        'That your cheque or wire is payable to the escrow agent, not to the developer.',
        'Whether the bold 10% legend appears on page one and above the signature line.',
        'Whether a bond or letter of credit has replaced the escrow of the first 10%.',
        'The deposit schedule: how much is due at contract, groundbreaking and top-off, and so how much will sit above the 10% line.',
      ] },
    ],
    faqs: [
      { q: 'Is my whole pre-construction deposit held in escrow in Florida?', a: 'The first 10% of the price must be held in escrow by an independent escrow agent, unless the state has accepted a bond or letter of credit instead. Money above 10% is held in a special escrow account, but the developer can withdraw it for construction costs once construction has begun if your contract contains the bold legend required by section 718.202(3).' },
      { q: 'Can the developer be its own escrow agent?', a: 'No. Section 718.202(8) says every escrow agent must be independent of the developer, and no developer or its officers, directors, affiliates, subsidiaries or employees may serve as escrow agent.' },
      { q: 'What happens if the developer does not follow the escrow rules?', a: 'Under section 718.202(5) the contract becomes voidable by the buyer, and if it is voided all sums deposited must be refunded with interest. Wilfully failing to comply is a third-degree felony under section 718.202(7).' },
    ],
    sources: [{ label: 'Florida Statutes § 718.202, Sales or reservation deposits prior to closing', url: FS('202') }, { label: 'Florida Statutes § 718.503, Developer disclosure prior to sale', url: FS('503') }],
  },
  {
    slug: 'florida-condo-15-day-right-to-cancel',
    title: 'Your 15-Day Right to Cancel a Florida Condo Contract',
    h1: 'Your 15-day right to cancel',
    description: 'Buying a new Florida condo from a developer? You can cancel within 15 days of signing and receiving all required documents. The right cannot be waived.',
    summary: 'A buyer who signs a contract with a Florida condo developer can cancel, in writing, within 15 days. The 15 days start only when two things have both happened: you have signed the contract, and you have received every document the developer is required to give you. Any clause that says you give up this right has no effect.',
    reviewed: '2026-11-20',
    blocks: [
      { type: 'h', text: 'What the law says' },
      { type: 'p', text: 'Section 718.503(1)(a) requires every developer contract for a residential unit to contain this legend in conspicuous type:' },
      { type: 'quote', text: 'THIS AGREEMENT IS VOIDABLE BY BUYER BY DELIVERING WRITTEN NOTICE OF THE BUYER’S INTENTION TO CANCEL WITHIN 15 DAYS AFTER THE DATE OF EXECUTION OF THIS AGREEMENT BY THE BUYER, AND RECEIPT BY BUYER OF ALL OF THE ITEMS REQUIRED TO BE DELIVERED TO HIM OR HER BY THE DEVELOPER UNDER SECTION 718.503, FLORIDA STATUTES.', cite: 'Fla. Stat. § 718.503(1)(a)1', url: FS('503') },
      { type: 'h', text: 'When the 15 days start' },
      { type: 'p', text: 'The clock needs both events: your signature and your receipt of all the required documents. If the developer hands you the documents a week after you sign, the 15 days run from the day you receive them. Until the documents are delivered, § 718.503(1)(b) says the contract "may be voided" and you are entitled to your deposit back with interest.' },
      { type: 'p', text: 'The required documents are normally the prospectus (or offering circular) with all its exhibits: the declaration of condominium, the association’s articles and bylaws, the estimated operating budget, the form of purchase agreement, the floor plan and plot plan, and more. The full list is in § 718.503(1)(b).' },
      { type: 'h', text: 'The right cannot be signed away' },
      { type: 'quote', text: 'ANY PURPORTED WAIVER OF THESE VOIDABILITY RIGHTS SHALL BE OF NO EFFECT.', cite: 'Fla. Stat. § 718.503(1)(a)1', url: FS('503') },
      { type: 'p', text: 'One related point: the developer may not close within the 15 days unless you are told about the voidability period and agree, in a separate signed agreement, to close early. That changes when you close, not whether the right existed.' },
      { type: 'h', text: 'A second 15 days if the deal changes against you' },
      { type: 'p', text: 'The same legend gives you another 15 days after you receive "any amendment which materially alters or modifies the offering in a manner that is adverse to the buyer". Ordinary changes to the estimated budget are specifically excluded: the statute says budget figures are estimates and changes in cost "do not constitute material adverse changes in the offering".' },
      { type: 'h', text: 'How to cancel' },
      { type: 'list', items: [
        'Put it in writing. The statute requires "written notice of the buyer’s intention to cancel".',
        'Deliver it to the developer within the 15 days, by the method your contract names for notices, and keep proof of delivery.',
        'Ask the escrow agent, in writing, for the return of your deposit.',
        'The right ends at closing: "Buyer’s right to void this agreement shall terminate at closing."',
      ] },
      { type: 'p', text: 'The statute says "15 days" for developer sales; it does not exclude weekends or holidays for this particular right, so count calendar days and do not leave it to the last one.' },
    ],
    faqs: [
      { q: 'When does the 15-day cancellation period start on a Florida pre-construction condo?', a: 'It starts when both things have happened: the buyer has signed the contract and has received all of the documents the developer must deliver under section 718.503 of the Florida Statutes. If the documents arrive after signing, the 15 days run from receipt.' },
      { q: 'Can a developer make me waive the 15-day right to cancel?', a: 'No. The legend required by section 718.503(1)(a)1 states that any purported waiver of these voidability rights shall be of no effect.' },
      { q: 'Do I get my deposit back if I cancel within 15 days?', a: 'Yes. A buyer who properly terminates the contract under the Condominium Act is paid the escrowed funds together with any interest earned, under section 718.202(1)(a).' },
    ],
    sources: [{ label: 'Florida Statutes § 718.503, Developer disclosure prior to sale; voidability', url: FS('503') }, { label: 'Florida Statutes § 718.202, Sales or reservation deposits prior to closing', url: FS('202') }],
  },
  {
    slug: 'reservation-vs-contract-florida-condo',
    title: 'Reservation vs Contract on a Florida Pre-Construction Condo',
    h1: 'Reservation vs contract',
    description: 'A Florida condo reservation is fully refundable on written request. A binding contract can only follow the developer’s filing with the state. The difference.',
    summary: 'A reservation holds your place in line; it does not commit you to buy. Florida law requires reservation deposits to sit with an escrow agent and to be refunded in full, immediately, when you ask in writing. A developer may only offer a binding purchase contract after filing the condominium documents with the state.',
    reviewed: '2026-11-20',
    blocks: [
      { type: 'table', head: ['', 'Reservation', 'Purchase contract'], rows: [
        ['Are you committed to buy?', 'No', 'Yes, after the 15-day cancellation period'],
        ['Can you get your money back?', 'Yes, in full, on written request, at any time before you sign a contract', 'Only if you cancel in time or the contract or the law lets you out'],
        ['Who holds the money?', 'An escrow agent. It cannot be released to the developer except as a down payment when you sign a contract', 'An escrow agent for the first 10%; rules differ above 10%'],
        ['When can the developer offer it?', 'After its reservation and escrow forms are filed with the state', 'After the condominium documents are filed with the state'],
        ['Is the price fixed?', 'Only if the reservation agreement says so', 'Yes, as written in the contract'],
      ] },
      { type: 'h', text: 'Reservations: refundable on request' },
      { type: 'p', text: 'Section 718.202(6) says reservation deposits must be paid to the escrow agent, who gives you a receipt, and then:' },
      { type: 'quote', text: 'Upon written request to the escrow agent by the prospective purchaser or developer, the funds shall be immediately and without qualification refunded in full to the prospective purchaser.', cite: 'Fla. Stat. § 718.202(6)', url: FS('202') },
      { type: 'p', text: 'Note the last part of that sentence: the developer can also cancel a reservation and have your money returned. A reservation does not guarantee you a unit.' },
      { type: 'p', text: 'The reservation agreement itself must tell you several things under § 718.502(2)(c): that the developer must file condominium documents with the state before entering a binding purchase agreement, that you have the right to receive all condominium documents, the escrow agent’s name and address, and whether the price in the reservation is assured, may be exceeded within a stated amount, or is not assured at all.' },
      { type: 'h', text: 'Contracts: only after the state filing' },
      { type: 'p', text: 'A developer must file its condominium documents with the Division of Florida Condominiums, Timeshares, and Mobile Homes. Before that filing, § 718.502(2)(a) says a developer "shall not offer a contract for purchase of a unit". And until the filing is made:' },
      { type: 'quote', text: 'a contract for sale of a unit or lease of a unit for more than 5 years shall be voidable by the purchaser or lessee prior to the closing of his or her purchase or lease of a unit.', cite: 'Fla. Stat. § 718.502(1)(a)', url: FS('502') },
      { type: 'p', text: 'The developer also cannot close until the division has notified it that the filing is proper and the required documents have been delivered to the buyer (§ 718.502(1)(b)).' },
      { type: 'h', text: 'When a reservation becomes a contract' },
      { type: 'p', text: 'When you sign a purchase agreement, your reservation deposit stops being covered by the reservation rules and becomes part of your contract deposit, covered by the 10% escrow rules. From that signature, and once you have all the documents, your 15-day right to cancel begins.' },
      { type: 'h', text: 'Questions to ask at the reservation stage' },
      { type: 'list', items: [
        'Who is the escrow agent, and is my payment made out to them?',
        'Is the price in this reservation assured, capped, or not assured?',
        'Has the developer filed its reservation program with the state?',
        'Does the developer own or control the land? Reservations cannot be taken without an ownership, leasehold or contractual interest in it.',
        'Where is the project in its approvals? A reservation on a project that has not been approved may wait a long time.',
      ] },
    ],
    faqs: [
      { q: 'Is a Florida condo reservation deposit refundable?', a: 'Yes. Under section 718.202(6) of the Florida Statutes, on written request to the escrow agent by the prospective purchaser or the developer, the funds must be immediately and without qualification refunded in full to the prospective purchaser.' },
      { q: 'When can a Florida developer offer a binding purchase contract?', a: 'Only after filing the condominium documents with the Division of Florida Condominiums, Timeshares, and Mobile Homes. Until that filing is made, section 718.502(1)(a) makes a contract voidable by the purchaser before closing.' },
      { q: 'Does a reservation lock in the price?', a: 'Not necessarily. The reservation agreement must state whether the price is assured, may be exceeded within a stated amount or percentage, or is not assured at all (section 718.502(2)(c)4).' },
    ],
    sources: [{ label: 'Florida Statutes § 718.502, Filing prior to sale or lease', url: FS('502') }, { label: 'Florida Statutes § 718.202, Sales or reservation deposits prior to closing', url: FS('202') }],
  },
  {
    slug: 'miami-approval-stages',
    title: 'What Miami’s Approval Stages Mean for Condo Buyers',
    h1: 'What Miami’s approval stages mean',
    description: 'ASPR, Warrant, Exception, Variance, Commission: what each City of Miami approval means, who decides it, and how we label a project’s stage with its source.',
    summary: 'A Miami tower is announced long before it is approved. Between the announcement and the first crane there is a public process: an application, a review by city staff, sometimes a hearing in front of a board or the City Commission, and then building permits. We show each project’s stage only when we can link to the public record it came from.',
    reviewed: '2026-11-20',
    blocks: [
      { type: 'h', text: 'The eight stages we use' },
      { type: 'table', head: ['Stage', 'What it means', 'What a buyer can rely on'], rows: [
        ['Proposed', 'Announced or reported. No application found on file.', 'Very little. Size, design and timing can all change.'],
        ['Pre-application', 'The developer has met city staff before filing.', 'The developer is serious enough to start the process.'],
        ['Under review', 'An application is with the city or county.', 'There is a public file you can read.'],
        ['Hearing scheduled', 'The project is on a published agenda.', 'A date on which a decision may be made.'],
        ['Approved (entitled)', 'The zoning approval has been granted.', 'The project may be built as approved, if it gets permits and financing.'],
        ['Permitted', 'A building permit has been issued.', 'Construction may legally start.'],
        ['Under construction', 'Work has started on site.', 'The building is going up.'],
        ['Completed', 'A certificate of occupancy has been issued.', 'Units can be occupied and closings can take place.'],
      ] },
      { type: 'p', text: 'Approval is not the same as sales. A developer can take reservations before a project is approved, and an approved project can still stall for financing.' },
      { type: 'h', text: 'City of Miami: the terms you will see' },
      { type: 'p', text: 'The City of Miami’s zoning code is called Miami 21. A project that fits the code "by right" needs less scrutiny than one that asks for something the code does not automatically allow.' },
      { type: 'list', items: [
        'ASPR (Administrative Site Plan Review). The city describes it as "an optional entitlement that locks-in your approved plans for a period of three (3) years". It is decided by the Zoning Administrator, without a board hearing, and is for projects that do not need special permits.',
        'Waiver. A small, administratively decided relief from a specific standard of the code.',
        'Warrant. A permit for a use that the zone does not allow by right. It is reviewed by city staff and decided administratively; the decision can be appealed to the Planning, Zoning and Appeals Board.',
        'Exception. A permit that, in the city’s words, "require[s] a hearing with the PZAB and may require City Commission approval". Neighbours are notified and can speak.',
        'Variance. Permission to depart from a requirement of the code, decided by the Planning, Zoning and Appeals Board at a public hearing.',
        'City Commission. The elected body. It decides rezonings and other legislative items, some Exceptions, and appeals of board decisions.',
      ] },
      { type: 'p', text: 'Two boards appear on most tower agendas. The Urban Development Review Board (UDRB) reviews the design of large projects and makes recommendations. The Planning, Zoning and Appeals Board (PZAB) decides Exceptions and Variances and hears appeals.' },
      { type: 'h', text: 'Outside the City of Miami' },
      { type: 'list', items: [
        'Miami Beach: the Design Review Board and the Planning Board (and the Historic Preservation Board in historic districts).',
        'Fort Lauderdale: the Development Review Committee, then the Planning and Zoning Board or City Commission for larger projects.',
        'Unincorporated Miami-Dade County: Community Zoning Appeals Boards and the Board of County Commissioners.',
      ] },
      { type: 'h', text: 'How we source a stage' },
      { type: 'list', items: [
        'Every stage on this site links to the public record it was read from: an agenda, a plan-review record or a permit.',
        'We show the date we last confirmed it. If that was more than 30 days ago and the project is still in motion, we say it may have moved on.',
        'If we cannot find a public record, the project reads "Stage not confirmed". We do not guess.',
      ] },
    ],
    faqs: [
      { q: 'What is an ASPR in Miami?', a: 'ASPR stands for Administrative Site Plan Review. The City of Miami describes it as an optional entitlement that locks in approved plans for three years, decided by the Zoning Administrator. It does not apply to projects that need special permits such as waivers, warrants, exceptions or variances.' },
      { q: 'What is the difference between a Warrant and an Exception in Miami?', a: 'Both are permits for uses a zone does not allow by right. A Warrant is decided administratively after staff review and can be appealed to the Planning, Zoning and Appeals Board. An Exception requires a public hearing before that board and may also require City Commission approval.' },
      { q: 'Does "approved" mean a Miami condo project will be built?', a: 'No. Approval (entitlement) means the project may be built as approved. It still needs building permits, financing and enough sales. Our stage tracker separates Approved, Permitted and Under construction for that reason.' },
    ],
    sources: [
      { label: 'City of Miami: Apply for an Administrative Site Plan Review (ASPR)', url: 'https://www.miami.gov/Permits-Construction/Land-Development-Main-Landing-Page/Apply-for-an-Administrative-Site-Plan-Review-ASPR' },
      { label: 'City of Miami: Apply for a Warrant Permit', url: 'https://www.miami.gov/Permits-Construction/Permit-Catalog/Apply-for-a-Warrant-Permit' },
      { label: 'City of Miami: Apply for an Exception Permit', url: 'https://www.miami.gov/Permits-Construction/Permit-Catalog/Apply-for-an-Exception-Permit' },
      { label: 'City of Miami: Planning, Zoning and Appeals Board', url: 'https://www.miami.gov/My-Government/Boards-Committees/Planning-Zoning-Appeals-Board-PZAB' },
      { label: 'City of Miami: meeting portal (agendas)', url: 'https://miamifl.iqm2.com/Citizens/' },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug) || null;
