ToDo List:

A) Skills Signal Engine
1) youth user, training provider, or community navigator inputs their education level,
informal experience, and demonstrated competencies.
[CV Parsing is done] , do ISCO + ESCO taxonomies [DONE]
2) The system maps these to a
standardized, portable skills profile grounded in real taxonomies (ISCO, ESCO, O∗NET or
equivalent). [DONE]
3) Display those skills to be human-readable. The person which puts it in should be able to understand and own it.

Side Requirement: Profile must be portable across borders & sectors, and explainable to a non-expert
user.
----

B) AI Readiness & Displacement Risk Lens

1) Given a skills profile and local labor market context, the tool produces an honest readiness
assessment: which parts of someone’s work are at automation risk, which skills are
durable, and what adjacent skills would increase resilience
2) This must be calibrated to
LMICs — automation risk looks different in Kampala than in Kuala Lumpur. Use the
Wittgenstein Centre 2025–2035 education projections to show how the landscape is
shifting, not just where it stands today.
3) Required: Must incorporate at least one real automation exposure dataset (e.g. Frey-Osborne,
ILO task indices, World Bank STEP).


----
C) Econometric Dashboard:

1) Get Wage floor, Sector employmenth growth, returns to education by level (Must show atleast two real econometric signals visibly to the user, not buried in the algorithm) 
2) Match user skills profile to realistic reachable opportunities [DONE]


------ 
Key functionailities:

1 Requirements:

Your tool must work as a layer that any government, NGO, training provider, or employer
could plug into and configure with local data — without rebuilding from scratch. Think
protocol, not product. Country-specific parameters (labor market data, education taxonomy,
language, automation calibration) should be inputs to your system, not hardcoded
assumptions.

Solved by:

We provide a low level platform based on a chatbot analysis and a CV analysis. This is different that other tools, because we want to make everyone available, even people without CV. The Chatbot tries to fill out a skill profile in the background and builds the Persona.
Country speific information is fetched live from the WHO database from the country. The different ai readiness skills are fetched from the database aswelll.

-

2 Requirements:

A youth user, training provider, or community navigator inputs their education level,
informal experience, and demonstrated competencies. The system maps these to a
standardized, portable skills profile grounded in real taxonomies (ISCO, ESCO, O∗NET or
equivalent). Critically: the profile must be human-readable. Amara should be able to
understand and own it — not just an AI.
Required: Profile must be portable across borders & sectors, and explainable to a non-expert
user.


Solved by:

A low level chatbot + CV analyzer matching the skills to ISCO and ESCO profile catalogues. We also track the data in a sql database to allow to understand it.
Required: Via the ISCO and Esco Profile we allow the user to research their profile and understand it more deeply and also get more information about adjacent skillsets. The profile are made portable by focusing on the skill, not the formal education. This is then fed to our Job Opportunity matching algorithm powered by tivoly, which abstract those skill levels to the city/country searched and finds all job opportunities. (even the ones in facebook groups)

-

3  Requirements - AI Readiness & Displacement Lens

Given a skills profile and local labor market context, the tool produces an honest readiness
assessment: which parts of someone’s work are at automation risk, which skills are
durable, and what adjacent skills would increase resilience. This must be calibrated to
LMICs — automation risk looks different in Kampala than in Kuala Lumpur. Use the
Wittgenstein Centre 2025–2035 education projections to show how the landscape is
shifting, not just where it stands today.
Required: Must incorporate at least one real automation exposure dataset (e.g. Frey-Osborne,
ILO task indices, World Bank STEP).

Solved by:

The skill is already extracted from the skill extraction part. This is simply then mapped to the frey osborne dataset and the skills are then shown with hte automation risk. Additionally it shows skills which are adjacent and can be learnt to improve one own career chances.

-

4  Opportunity Matching & Econometric Dashboard
Surface real labor market signals — wage floors, sector employment growth, returns to
education by level — and connect a user’s skills profile to realistic, reachable opportunities.
This is not aspirational matching (‘you could be a software engineer’). It is honest,
grounded matching that accounts for local realities. This module has a dual interface: one
for the youth user, one for a policymaker or program officer viewing aggregate signals.
Required: Must surface at least two real econometric signals visibly to the user — not buried in
the algorithm.

Solved by:

We provide wage floor, sector employment data and information about the profile. Some do not have much formal employment, so we also mention how such skills/profiles usually earn money. It then runs a matching algorithm that scans facebook groups & job sites for jobs which would be suitable. Based on that, the user gets a review and can see the changes. 

5 Requirements:

Country Agnostic Requiremnt:

• Labor market data source and structure (wage indices, sector classifications)[DONE]
• Education level taxonomy and credential mapping[TODO]
• Language and script of the user interface[To mention]
• Automation exposure calibration (risk profiles differ by infrastructure context)[DONE]
• Opportunity types surfaced (formal employment, self-employment, gig, training
pathways)
[DONE]