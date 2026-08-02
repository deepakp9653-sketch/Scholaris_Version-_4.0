export interface CategorySubcategoryConfig {
  category: "OPEN" | "SC" | "ST" | "VJ/DT" | "NTB" | "NTC" | "NTD" | "OBC" | "SEBC";
  huGeneral: number;
  huLadies: number;
  ohuGeneral: number;
  ohuLadies: number;
  pwd: number;
  def: number;
}

export interface DepartmentSeatMatrixConfig {
  choiceCode: string;
  departmentName: string;
  shortCode: string;
  sanctionIntake: number;
  msSeats: number;
  minoritySeats: number;
  allIndiaSeats: number;
  instituteSeats: number;
  orphanI: number;
  orphanN: number;
  ewsSeats: number;
  tfwsCode: string;
  tfwsSeats: number;
  categories: CategorySubcategoryConfig[];
}

export const OFFICIAL_SEAT_MATRIX: DepartmentSeatMatrixConfig[] = [
  {
    choiceCode: "0664924510",
    departmentName: "Computer Engineering",
    shortCode: "Comp",
    sanctionIntake: 180,
    msSeats: 117,
    minoritySeats: 0,
    allIndiaSeats: 27,
    instituteSeats: 36,
    orphanI: 0,
    orphanN: 1,
    ewsSeats: 18,
    tfwsCode: "0664924511T",
    tfwsSeats: 9,
    categories: [
      { category: "OPEN", huGeneral: 21, huLadies: 9, ohuGeneral: 8, ohuLadies: 4, pwd: 2, def: 2 },
      { category: "SC", huGeneral: 8, huLadies: 3, ohuGeneral: 2, ohuLadies: 1, pwd: 1, def: 1 },
      { category: "ST", huGeneral: 4, huLadies: 2, ohuGeneral: 1, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "VJ/DT", huGeneral: 1, huLadies: 1, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTB", huGeneral: 1, huLadies: 1, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTC", huGeneral: 2, huLadies: 1, ohuGeneral: 0, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "NTD", huGeneral: 1, huLadies: 1, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "OBC", huGeneral: 11, huLadies: 4, ohuGeneral: 4, ohuLadies: 2, pwd: 1, def: 1 },
      { category: "SEBC", huGeneral: 5, huLadies: 2, ohuGeneral: 1, ohuLadies: 1, pwd: 1, def: 1 },
    ],
  },
  {
    choiceCode: "0664937210",
    departmentName: "Electronics and Telecommunication Engg",
    shortCode: "ETC",
    sanctionIntake: 60,
    msSeats: 45,
    minoritySeats: 0,
    allIndiaSeats: 9,
    instituteSeats: 6,
    orphanI: 0,
    orphanN: 0,
    ewsSeats: 6,
    tfwsCode: "0664937211T",
    tfwsSeats: 3,
    categories: [
      { category: "OPEN", huGeneral: 9, huLadies: 3, ohuGeneral: 3, ohuLadies: 1, pwd: 1, def: 1 },
      { category: "SC", huGeneral: 3, huLadies: 1, ohuGeneral: 1, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "ST", huGeneral: 1, huLadies: 1, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "VJ/DT", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTB", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTC", huGeneral: 0, huLadies: 0, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTD", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "OBC", huGeneral: 5, huLadies: 2, ohuGeneral: 1, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "SEBC", huGeneral: 2, huLadies: 1, ohuGeneral: 2, ohuLadies: 0, pwd: 0, def: 0 },
    ],
  },
  {
    choiceCode: "0664961210",
    departmentName: "Mechanical Engineering",
    shortCode: "Mech",
    sanctionIntake: 60,
    msSeats: 51,
    minoritySeats: 0,
    allIndiaSeats: 9,
    instituteSeats: 0,
    orphanI: 0,
    orphanN: 1,
    ewsSeats: 6,
    tfwsCode: "0664961211T",
    tfwsSeats: 3,
    categories: [
      { category: "OPEN", huGeneral: 9, huLadies: 4, ohuGeneral: 3, ohuLadies: 2, pwd: 1, def: 1 },
      { category: "SC", huGeneral: 3, huLadies: 2, ohuGeneral: 2, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "ST", huGeneral: 2, huLadies: 0, ohuGeneral: 0, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "VJ/DT", huGeneral: 0, huLadies: 1, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTB", huGeneral: 0, huLadies: 0, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTC", huGeneral: 2, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTD", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "OBC", huGeneral: 4, huLadies: 1, ohuGeneral: 2, ohuLadies: 0, pwd: 1, def: 1 },
      { category: "SEBC", huGeneral: 3, huLadies: 1, ohuGeneral: 0, ohuLadies: 1, pwd: 0, def: 0 },
    ],
  },
  {
    choiceCode: "0664919110",
    departmentName: "Civil Engineering",
    shortCode: "Civil",
    sanctionIntake: 60,
    msSeats: 51,
    minoritySeats: 0,
    allIndiaSeats: 9,
    instituteSeats: 0,
    orphanI: 1,
    orphanN: 0,
    ewsSeats: 6,
    tfwsCode: "0664919111T",
    tfwsSeats: 3,
    categories: [
      { category: "OPEN", huGeneral: 9, huLadies: 4, ohuGeneral: 4, ohuLadies: 1, pwd: 1, def: 1 },
      { category: "SC", huGeneral: 2, huLadies: 2, ohuGeneral: 1, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "ST", huGeneral: 2, huLadies: 0, ohuGeneral: 1, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "VJ/DT", huGeneral: 2, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTB", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTC", huGeneral: 1, huLadies: 0, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTD", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "OBC", huGeneral: 3, huLadies: 2, ohuGeneral: 1, ohuLadies: 1, pwd: 1, def: 1 },
      { category: "SEBC", huGeneral: 2, huLadies: 1, ohuGeneral: 1, ohuLadies: 1, pwd: 0, def: 0 },
    ],
  },
  {
    choiceCode: "0664929310",
    departmentName: "Electrical Engineering",
    shortCode: "Elect",
    sanctionIntake: 60,
    msSeats: 51,
    minoritySeats: 0,
    allIndiaSeats: 9,
    instituteSeats: 0,
    orphanI: 1,
    orphanN: 0,
    ewsSeats: 6,
    tfwsCode: "0664929311T",
    tfwsSeats: 3,
    categories: [
      { category: "OPEN", huGeneral: 9, huLadies: 4, ohuGeneral: 4, ohuLadies: 1, pwd: 1, def: 1 },
      { category: "SC", huGeneral: 3, huLadies: 1, ohuGeneral: 2, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "ST", huGeneral: 2, huLadies: 1, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "VJ/DT", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 1, pwd: 0, def: 0 },
      { category: "NTB", huGeneral: 1, huLadies: 0, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTC", huGeneral: 1, huLadies: 1, ohuGeneral: 0, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "NTD", huGeneral: 0, huLadies: 0, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
      { category: "OBC", huGeneral: 3, huLadies: 2, ohuGeneral: 2, ohuLadies: 0, pwd: 1, def: 1 },
      { category: "SEBC", huGeneral: 2, huLadies: 2, ohuGeneral: 1, ohuLadies: 0, pwd: 0, def: 0 },
    ],
  },
];
