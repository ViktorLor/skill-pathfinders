# Title
Skill Pathfinders: AI-Powered Career Discovery for Emerging Economies

# Short Description

Skill Pathfinders is a lightweight career guidance and talent visibility platform designed to help students, job seekers, and career switchers identify realistic job pathways based on their current skills, local labor market demand, and access to learning opportunities. It is specifically built to support individuals with limited formal documentation or informally acquired skills (e.g., through self-learning or platforms like YouTube), enabling them to make their capabilities visible, structured, and actionable.

The platform combines automated profile analysis, role matching, and targeted upskilling recommendations to translate uncertain career situations into clear, step-by-step development paths. It further incorporates localized assessments of automation risk, helping users understand how AI and technological change may impact specific jobs and which skills are becoming more resilient or obsolete.

A core feature is the creation of transparent, skill-based talent profiles of unemployed or underemployed individuals, which can be actively discovered by businesses, entrepreneurs, and organizations. Instead of relying on formal CVs, the platform enables direct matching based on demonstrated skills and potential, allowing any business to identify and engage relevant candidates efficiently.

In addition, Skill Pathfinders integrates a job discovery layer that aggregates opportunities from both formal and informal channels (e.g., online job boards and social media platforms), matching them directly to user profiles.

For policymakers and ecosystem stakeholders, the platform provides an aggregated analytics and talent pool view, offering insights into workforce skill distributions, active job seekers, and unmet demand. This creates a shared infrastructure where talent becomes visible, matchable, and economically actionable across the entire ecosystem.

# Problem & Challenge
Millions of people in developing and underserved regions face a structural disconnect between the skills they possess and the jobs they can realistically access. This gap is not only informational but systemic: skills—especially those acquired informally (e.g., through self-learning, apprenticeships, or platforms like YouTube)—remain largely invisible to the labor market.

Existing career platforms are primarily designed for high-income environments. They assume stable internet access, formal education pathways, and well-documented CVs. As a result, they systematically exclude individuals with non-traditional backgrounds and fail to capture real capabilities and potential.

At the same time, employers—particularly small and informal businesses—lack efficient ways to discover and evaluate talent beyond formal credentials. This leads to a coordination failure:

- Job seekers cannot signal their true skills
- Employers cannot identify suitable candidates
- Policymakers lack reliable data on workforce capabilities and demand

In addition, rapid technological change introduces further uncertainty. Many users are unaware of how automation and AI will impact local job markets, making it difficult to prioritize which skills to develop.

The result is a fragmented ecosystem where:

- Career decisions are based on incomplete or misleading information
- Training efforts are misaligned with actual market demand
- Employment opportunities—especially informal ones—remain underutilized
- Large pools of capable individuals remain economically invisible

# Target Audience (Mostly Third world countries)
Skill Pathfinders is designed for emerging and underserved labor markets, with a primary focus on youth and early-career individuals in low- and middle-income regions.

Primary users (talent supply side):

-Students in public education systems with limited career guidance
-Graduates in tier-2 cities and rural areas with constrained access to formal job markets
-Workers in informal sectors seeking transition into more stable or higher-income employment
-Self-taught individuals with undocumented or non-formalized skills

These users typically lack structured visibility of their capabilities and face significant barriers in signaling their potential to employers.

Secondary users (talent demand side):

-Small and medium-sized businesses, including informal employers, that need efficient access to pre-qualified, skill-matched candidates
-Entrepreneurs and local operators seeking flexible or project-based talent

-Ecosystem stakeholders (intermediaries and decision-makers):

-NGOs, training providers, and employment programs that require scalable tools to guide cohorts toward employable outcomes
-Policymakers and public institutions that need aggregated, real-time insights into workforce skills, job demand, and employment gaps to design effective interventions

# Solution & Core Features
Skill Pathfinders provides an end-to-end platform for skill extraction, standardization, career guidance, and labor market matching, tailored to underserved and informal labor markets.

At its core, the system uses a dynamic profiling pipeline: user inputs (CVs, questionnaires, or conversational data) are processed via an LLM-based approach to extract structured skill profiles. These profiles are then persisted in a database and mapped to standardized taxonomies—primarily International Labour Organization’s ISCO-08 classification and the European Commission’s ESCO skills taxonomy—to ensure comparability and interoperability across regions.

To contextualize recommendations and opportunities, the platform integrates macro- and labor-market datasets, including:

Wittgenstein Centre for Demography and Global Human Capital (education and demographic projections)
World Bank World Development Indicators (economic and labor data)
Automation risk estimates based on Carl Benedikt Frey & Michael Osborne

This enables dynamic localization, where user profiles and recommendations are continuously aligned with country-specific labor demand, economic conditions, and automation exposure.

Core features include:

Intelligent skill profiling: Extraction and structuring of formal and informal skills into standardized, comparable profiles
Career path recommendations: Role matching based on transferable skills and local demand signals
Skill gap analysis & guided roadmaps: Clear, prioritized learning paths showing what to learn next and why
AI-driven job matching platform: Aggregation and matching of opportunities from both formal and informal channels
Automation risk analysis: Identification of job and skill exposure to automation, with actionable reskilling guidance
Low-bandwidth design: Usable in constrained connectivity environments

For businesses and policymakers, the platform provides an analytics and intelligence layer:

Real-time visibility into workforce skills, job seekers, and demand gaps
Data-driven insights into employment dynamics, including informal sector signals
The ability to identify, filter, and match candidates based on actual capabilities rather than formal credentials

# USP
Skill Pathfinders enables economically invisible talent to become visible, comparable, and matchable within local labor markets.

Unlike conventional career platforms that rely on formal credentials, the system is built around potential over pedigree. It allows individuals from low-income and informal backgrounds to capture and structure skills acquired outside formal education (e.g., self-learning, apprenticeships), making their capabilities measurable and actionable.

At the same time, the platform unlocks a previously inaccessible talent pool for employers by enabling discovery of informal and non-traditional candidates based on actual skills rather than CV quality. This directly addresses a key inefficiency in underserved markets: talent exists, but cannot be identified or evaluated efficiently.

A core differentiator is the data-driven standardization layer, where unstructured user profiles are mapped to globally recognized taxonomies and enriched with localized labor market and automation data. This ensures that all recommendations—career paths, job matches, and learning roadmaps—are not generic, but contextually grounded in what is realistically achievable within a specific region.

For policymakers and ecosystem stakeholders, Skill Pathfinders provides a real-time, bottom-up view of the labor market, including:

Visibility into unemployed and underemployed populations based on actual skills
Identification of mismatches between workforce capabilities and demand
Empirical grounding for targeted interventions and workforce development programs

In essence, the platform acts as a coordination layer between talent, employers, and institutions—transforming fragmented, informal labor markets into structured, data-driven ecosystems.

# Implementation & Technology
Technical Architecture

The application is built on a modern TypeScript-based stack, using Vite for frontend tooling and Bun for high-performance package management and runtime execution. The system is designed as a modular, cloud-deployable architecture that can scale across countries and partner ecosystems.

Data Layer

Candidate and system data are stored in a SQL-based database, which serves as the central source of truth for:

Structured skill profiles
Job opportunities
Matching results and analytics

Data is internally represented and exchanged using JSON-based schemas, enabling flexible integration with external datasets and services. Selected global datasets (e.g., skill taxonomies, classification mappings) are currently embedded as predefined data layers, with the architecture designed to support future dynamic ingestion.

AI & Knowledge Layer

Core profile generation and enrichment are handled via an LLM-driven processing pipeline, where:

User inputs (CVs, questionnaires, conversational input) are transformed into structured skill profiles
Context-aware prompting and lightweight knowledge management techniques are used to ensure consistent outputs
Extracted skills are normalized and aligned with standardized taxonomies

This layer enables dynamic interpretation of informal and unstructured data, which is critical for the target user base.

Integration & Data Acquisition

Job opportunities are aggregated using targeted web scraping via Tavily, focusing on both formal job boards and informal online sources. This allows the system to capture opportunities that are typically not accessible through conventional APIs.

All external and internal services are exposed through a REST-based API layer, ensuring modularity and interoperability between components.

Application Layer

The platform includes:

A user-facing interface for profile creation, career guidance, and job matching
A dashboard layer (powered by SQL queries) for analytics, monitoring, and policymaker insights
Key Characteristics
Low-bandwidth optimization for constrained environments
Localization support for 10+ languages via DeepL Architecture
Multi-Country localisation for all WHO which have data.
Modular service design enabling independent scaling of data, AI, and application components

# Result + Impact
We have built a fully functional, end-to-end platform that is ready for immediate use. The system covers the complete workflow—from candidate profile intake and skill extraction to personalized career guidance, job matching, and analytics—within a single integrated solution.

In practice, users can move from an unstructured or unclear career situation to a concrete, prioritized action plan within minutes. This significantly reduces decision paralysis and provides clear direction on which skills to develop and which opportunities to pursue.

The platform makes previously invisible, informally acquired skills structured and discoverable, enabling more efficient matching between job seekers and employers—even in fragmented and informal labor markets.

At scale, the impact is threefold:

For individuals: improved employability, clearer career pathways, and increased income resilience
For businesses: access to a broader, skill-based talent pool beyond formal credentials
For policymakers and ecosystems: real-time visibility into workforce capabilities and demand, enabling more effective, data-driven interventions

Overall, the system transforms disconnected labor market signals into a coordinated, actionable ecosystem, where talent can be identified, developed, and matched more efficiently.

# Additional Information
The current system relies on an LLM-based pipeline for skill extraction, profile generation, and career recommendation. As a result, output correctness and consistency cannot be fully guaranteed, particularly when processing highly unstructured or ambiguous user inputs. While prompt design and context management were iterated to improve stability, the approach remains probabilistic by nature.

To evaluate robustness, we tested multiple configurations (four distinct prompting/processing setups) and simulated ecosystem behavior using ~200 seeded data entries. The results are promising: the platform consistently generates usable profiles, enables job discovery from informal channels (e.g., social media sources), and meaningfully supports users with non-formal education backgrounds.

However, these results should be interpreted as early-stage validation rather than production-grade reliability. For real-world deployment, significantly more extensive testing would be required, including:

Larger and more diverse real-user datasets
Cross-country validation of localization logic
Systematic evaluation of extraction accuracy and matching quality

A key limitation is the absence of a deterministic validation layer. As a next step, we considered introducing rule-based or ontology-driven pipelines for parts of the system (e.g., career path generation and skill normalization) to complement or partially replace LLM outputs. This hybrid approach could improve reproducibility and auditability. Due to time constraints within the hackathon setting, this was not implemented.

In summary, while the current prototype demonstrates strong practical potential and clear user value, further engineering, validation, and hybridization of AI components are required to ensure reliability at scale.

# Technologies Tag
TypeScript, Vite, Bun, JSON Data Pipelines, Localization , Cloudflare/Wrangler-ready Deployment, Modular Frontend Architecture, SQL

# Github Link

Additional 8 images,

A 2 Video presentation for local

A 1 minute video for technical stack 
A 1 minute video for UI