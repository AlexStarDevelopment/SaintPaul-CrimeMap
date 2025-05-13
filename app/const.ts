export type dataSelectionType = {
  id: number;
  month: string;
  year: number;
};

export const dataSelection: dataSelectionType[] = [
  { id: 27, month: "april", year: 2025 },
  { id: 26, month: "march", year: 2025 },
  { id: 25, month: "february", year: 2025 },
  { id: 23, month: "january", year: 2025 },
  { id: 24, month: "all", year: 2025 },
  { id: 6, month: "all", year: 2024 },
  { id: 7, month: "all", year: 2023 },
  { id: 8, month: "all", year: 2022 },
  { id: 9, month: "all", year: 2021 },
  { id: 10, month: "all", year: 2020 },
  { id: 11, month: "all", year: 2019 },
  { id: 12, month: "all", year: 2018 },
  { id: 13, month: "all", year: 2017 },
  { id: 14, month: "all", year: 2016 },
  { id: 15, month: "all", year: 2015 },
  { id: 16, month: "all", year: 2014 },
];

export const mappingSelection = {
  april25: 27,
  march25: 26,
  february25: 25,
  january25: 23,
  all2025: 24,
  all2024: 6,
  all2023: 7,
  all2022: 8,
  all2021: 9,
  all2020: 10,
  all2019: 11,
  all2018: 12,
  all2017: 13,
  all2016: 14,
  all2015: 15,
  all2014: 16,
};
