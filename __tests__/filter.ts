import Vue from 'vue';
import { formatGoogleDate, jstDateTimeFromStr } from '~/utils/Dates';
import def, { truncate } from '~/utils/Strings';
import dollar, { yen, euro } from '~/utils/Money';
import { Date as gDate } from '~/types/gen/google/type/date_pb';
import { i18n, i18nHints } from '~/plugins/i18n';
import { calculateUnPaid } from '~/utils/Mf';
import { Bill } from '~/types/gen/mercari/platform/proto/microservices/merpay-admin-cs-api-jp/api/mf/v1/resource_pb';

Vue.filter('tojstUntilSeconds', (value: string) => {
  return jstDateTimeFromStr(value, true);
});

Vue.filter('stringDefaultFilter', def);
Vue.filter(
  'truncate',
  (value: string, indexEnd: number, leader: string = '...') => {
    return truncate(value, indexEnd, leader);
  },
);

Vue.filter('percent', (value: string) => `${value}%`);

Vue.filter('formatDate', (date: gDate) => formatGoogleDate(date));

Vue.filter(
  'numeric',
  (value: string) => `${parseInt(value, 10).toLocaleString()}`,
);
Vue.filter('dollar', dollar);
Vue.filter('yen', yen);
Vue.filter('eur', euro);

// for pringing
Vue.filter('yenForPrinting', (value: string) => {
  return `${parseInt(value + '', 10).toLocaleString('ja-JP')} ${i18n.tc(
    i18nHints.common.label.currency,
  )}`;
});

// 後払い・債権調査票
Vue.filter('unpaidString', (bill: Bill) => {
  return calculateUnPaid(bill);
});
