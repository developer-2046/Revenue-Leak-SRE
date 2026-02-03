export const CONFIG = {
    // SLO Config
    SLA_LEAD_RESPONSE_MINS: 30,
    OPP_STALENESS_DAYS: 7,

    // Revenue Config
    DEFAULT_ERROR_BUDGET_USD: 50000,
    AVERAGE_DEAL_SIZE_USD: 15000,

    // Impact Config
    WIN_PROBABILITY: {
        New: 0.10,
        Qualified: 0.25,
        Proposal: 0.45,
        Negotiation: 0.65,
        Closed_Won: 1.0,
        Closed_Lost: 0.0
    },
    DECAY_HALFLIFE_DAYS: 14,

    // Paging Thresholds (Burn Rate)
    PAGING_THRESHOLD_WARN: 0.25,
    PAGING_THRESHOLD_PAGE: 0.50
};
