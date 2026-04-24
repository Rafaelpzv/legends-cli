"use strict";
// ─── Regions & Routing ──────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_FILTER_IDS = exports.QUEUE_MAP = exports.REGION_LABELS = exports.REGION_TO_CLUSTER = void 0;
exports.REGION_TO_CLUSTER = {
    br1: 'americas', na1: 'americas', la1: 'americas', la2: 'americas',
    euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
    kr: 'asia', jp1: 'asia',
    oc1: 'sea',
};
exports.REGION_LABELS = {
    br1: 'Brazil (BR)',
    na1: 'North America (NA)',
    euw1: 'EU West (EUW)',
    eun1: 'EU Nordic & East (EUNE)',
    kr: 'Korea (KR)',
    jp1: 'Japan (JP)',
    la1: 'Latin America North (LAN)',
    la2: 'Latin America South (LAS)',
    oc1: 'Oceania (OCE)',
    tr1: 'Turkey (TR)',
    ru: 'Russia (RU)',
};
// ─── Queue Types ─────────────────────────────────────────────────────────────
exports.QUEUE_MAP = {
    420: 'Ranked Solo/Duo',
    440: 'Ranked Flex',
    450: 'ARAM',
    400: 'Normal Draft',
    430: 'Normal Blind',
    700: 'Clash',
    0: 'Custom',
    490: 'Quickplay',
    900: 'URF',
    1020: 'One for All',
    1300: 'Nexus Blitz',
    1400: 'Ultimate Spellbook',
    1700: 'Arena',
    1900: 'URF',
};
exports.QUEUE_FILTER_IDS = {
    all: null,
    ranked: [420, 440],
    normal: [400, 430, 490],
    aram: [450],
};
