import { z } from "zod";

export const monthNamesShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const monthIndexByName = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
} as const;

export type MonthName = keyof typeof monthIndexByName;

export const getMonthIndexFromName = (month: MonthName) => {
  return monthIndexByName[month];
};

export const getMonthNameFromIndex = (index: number) => {
  return monthNamesShort[index];
};

export const ZodMonthShort = z.enum(monthNamesShort);

export const yearOptions = Array.from({ length: 31 }, (_, i) => 2020 + i);
