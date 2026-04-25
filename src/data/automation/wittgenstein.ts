/**
 * Wittgenstein Centre 2025–2035 projections, distilled to skill-cluster
 * outlooks for LMIC regions. The Centre publishes projections at the level
 * of education attainment by age × sex × region (no REST API — bulk CSV
 * download from their Human Capital Data Explorer); this table summarises
 * the directional implications for hiring demand in the clusters our
 * adjacent-skill engine recommends from.
 */
export type Region = "SSA" | "SAS";

export type SkillCluster =
  | "software_core"
  | "cloud_devops"
  | "data_engineering"
  | "ai_orchestration"
  | "fintech_integration"
  | "electronics_repair"
  | "iot_diagnostics"
  | "customer_training"
  | "digital_commerce"
  | "smallholder_farming"
  | "agritech_apps"
  | "post_harvest"
  | "climate_smart_ag"
  | "cooperative_finance"
  | "scripted_writing"
  | "manual_bookkeeping";

export interface ClusterOutlook {
  outlook: "rising" | "stable" | "shrinking";
  rationale: string;
}

export const WITTGENSTEIN_OUTLOOK: Record<Region, Partial<Record<SkillCluster, ClusterOutlook>>> = {
  SSA: {
    software_core: {
      outlook: "stable",
      rationale:
        "SSA tertiary-educated labor force grows ~3.4%/yr through 2035, but GenAI compresses entry-level coding demand.",
    },
    cloud_devops: {
      outlook: "rising",
      rationale:
        "Infrastructure roles in African tech hubs grow faster than frontend; less GenAI-displaced.",
    },
    data_engineering: {
      outlook: "rising",
      rationale: "Fintech/agritech data pipelines projected to expand sharply.",
    },
    ai_orchestration: {
      outlook: "rising",
      rationale: "Wittgenstein flags AI-using occupations as fastest-growing.",
    },
    fintech_integration: {
      outlook: "stable",
      rationale: "Mobile-money APIs (MoMo, Paystack) sustain demand; local context unautomatable.",
    },
    electronics_repair: {
      outlook: "stable",
      rationale: "Device penetration rising in SSA; informal repair sector stays large.",
    },
    iot_diagnostics: {
      outlook: "rising",
      rationale: "Connected-appliance imports growing; repair skills transfer directly.",
    },
    customer_training: {
      outlook: "rising",
      rationale: "In-person tech demos grow with device adoption; non-routine interpersonal.",
    },
    digital_commerce: {
      outlook: "stable",
      rationale: "WhatsApp / social commerce demand flat-to-rising for traders.",
    },
    smallholder_farming: {
      outlook: "stable",
      rationale: "Rural workforce share declines slowly; absolute numbers stable through 2035.",
    },
    agritech_apps: {
      outlook: "rising",
      rationale: "Wittgenstein flags digital ag literacy as fastest-rising rural skill.",
    },
    post_harvest: {
      outlook: "rising",
      rationale: "Policy push on value addition (MoFA Ghana 2025).",
    },
    climate_smart_ag: {
      outlook: "rising",
      rationale: "Climate-adaptation skills are the top growth cluster for rural SSA.",
    },
    cooperative_finance: {
      outlook: "stable",
      rationale: "VSLA and group-savings remain core to rural finance.",
    },
    scripted_writing: {
      outlook: "shrinking",
      rationale: "GenAI displaces routine drafting fastest.",
    },
    manual_bookkeeping: {
      outlook: "shrinking",
      rationale: "Mobile bookkeeping apps replace manual ledgers.",
    },
  },
  SAS: {
    software_core: {
      outlook: "stable",
      rationale:
        "South Asia tertiary attainment rising fastest globally, but GenAI pressure on entry-level coding offsets growth.",
    },
    cloud_devops: { outlook: "rising", rationale: "Cloud demand strong across India/Bangladesh." },
    data_engineering: { outlook: "rising", rationale: "Fintech and gov-tech pipelines expanding." },
    ai_orchestration: { outlook: "rising", rationale: "AI-using roles flagged fastest-growing." },
    fintech_integration: { outlook: "stable", rationale: "bKash / UPI integration roles steady." },
    electronics_repair: { outlook: "stable", rationale: "Large informal repair sector persists." },
    iot_diagnostics: { outlook: "rising", rationale: "Smart-device imports growing." },
    customer_training: {
      outlook: "rising",
      rationale: "Digital-skills training market expanding.",
    },
    digital_commerce: { outlook: "rising", rationale: "Social commerce booming in BGD." },
    smallholder_farming: { outlook: "stable", rationale: "Rural share declines slowly." },
    agritech_apps: { outlook: "rising", rationale: "Digital ag adoption accelerating." },
    post_harvest: { outlook: "rising", rationale: "Cold-chain and processing investment growing." },
    climate_smart_ag: {
      outlook: "rising",
      rationale: "Climate adaptation top priority for South Asian agriculture.",
    },
    cooperative_finance: { outlook: "stable", rationale: "MFI and SHG sectors stable." },
    scripted_writing: { outlook: "shrinking", rationale: "GenAI displaces routine drafting." },
    manual_bookkeeping: {
      outlook: "shrinking",
      rationale: "Digital ledgers replacing paper books.",
    },
  },
};

export const COUNTRY_REGION: Record<string, Region> = {
  GHA: "SSA",
  NGA: "SSA",
  BGD: "SAS",
};

export const WITTGENSTEIN_META = {
  source: "Wittgenstein Centre Human Capital Data Explorer v2.0 (2024 release, SSP2 scenario)",
  url: "https://dataexplorer.wittgensteincentre.org/",
};
