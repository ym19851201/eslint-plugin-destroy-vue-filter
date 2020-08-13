import Vue from 'vue';
import { formatGoogleDate, jstDateTimeFromStr } from '~/utils/Dates';
import def, { truncate } from '~/utils/Strings';
import _dollar, { yen as _yen, euro } from '~/utils/Money';
import { Date as gDate } from '~/types/gen/google/type/date_pb';
import { i18n, i18nHints } from '~/plugins/i18n';
import { calculateUnPaid } from '~/utils/Mf';
import { Bill } from '~/types/gen/mercari/platform/proto/microservices/merpay-admin-cs-api-jp/api/mf/v1/resource_pb';

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
export const dollar = _dollar;
export const yen = _yen;
export const eur = euro;

// for pringing
export const yenForPrinting = (value: string) => {
  return `${parseInt(value + '', 10).toLocaleString('ja-JP')} ${i18n.tc(
    i18nHints.common.label.currency,
  )}`;
};

// 後払い・債権調査票
export const unpaidString = (bill: Bill) => {
  return calculateUnPaid(bill);
};
