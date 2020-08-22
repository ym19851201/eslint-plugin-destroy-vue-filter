import { formatGoogleDate, jstDateTimeFromStr } from '~/utils/Dates';
import def, { truncate as _truncate } from '~/utils/Strings';
import dollar, { yen, euro } from '~/utils/Money';
import { Date as gDate } from '~/types/gen/google/type/date_pb';
import { i18n, i18nHints } from '~/plugins/i18n';
import { calculateUnPaid } from '~/utils/Mf';
import { Bill } from '~/resource';

export const tojstUntilSeconds = (value: string) => {
  return jstDateTimeFromStr(value, true);
};

export const stringDefaultFilter = def;
export const truncate = (value: string, indexEnd: number, leader: string = '...') => {
    return truncate(value, indexEnd, leader);
  };

export const percent = (value: string) => `${value}%`;

export const formatDate = (date: gDate) => formatGoogleDate(date);

export const numeric = (value: string) => `${parseInt(value, 10).toLocaleString()}`;
export { dollar };
export { yen };
export const eur = euro;

// COMMENT1
export const yenForPrinting = (value: string) => {
  return `${parseInt(value + '', 10).toLocaleString('ja-JP')} ${i18n.tc(
    i18nHints.common.label.currency,
  )}`;
};

// COMMENT2
export const unpaidString = (bill: Bill) => {
  return calculateUnPaid(bill);
};

export function func(xxx: string) {
  return `xxx${xxx}xxx`;
}

