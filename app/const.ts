export type dataSelectionType = {
  id: number;
  month: string;
  year: number;
};

export const dataSelection: dataSelectionType[] = [
  { id: 1, month: "all", year: 2023 },
  { id: 2, month: "all", year: 2024 },
  { id: 3, month: "january", year: 2024 },
  { id: 4, month: "february", year: 2024 },
  { id: 5, month: "march", year: 2024 },
  { id: 6, month: "april", year: 2024 },
  { id: 7, month: "may", year: 2024 },
  { id: 8, month: "june", year: 2024 },
];

export const mappingSelection = {
  all2023: 0,
  all2024: 1,
  january24: 2,
  february24: 3,
  march24: 4,
  april24: 5,
  may24: 6,
  june24: 7,
};
