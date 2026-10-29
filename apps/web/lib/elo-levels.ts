const ELO_LEVELS = [
  { level: 1, minimum: 100, maximum: 800 },
  { level: 2, minimum: 801, maximum: 950 },
  { level: 3, minimum: 951, maximum: 1100 },
  { level: 4, minimum: 1101, maximum: 1250 },
  { level: 5, minimum: 1251, maximum: 1400 },
  { level: 6, minimum: 1401, maximum: 1550 },
  { level: 7, minimum: 1551, maximum: 1700 },
  { level: 8, minimum: 1701, maximum: 1850 },
  { level: 9, minimum: 1851, maximum: 2000 },
  { level: 10, minimum: 2001, maximum: null },
] as const

export default ELO_LEVELS
