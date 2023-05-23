import {getJson, postJson, putJson} from "./index";

export async function createIndicatorReport(params) {
  return postJson(`/api/indicatorReport/`, params);
}

export async function fetchIndicatorReport(uri) {
  return getJson(`/api/indicatorReport/${uri}`);
}

export async function updateIndicatorReport(uri, params) {
  return putJson(`/api/indicatorReport/${uri}`, params);
}

export async function fetchIndicatorReports(orgUri) {
  return getJson(`/api/indicatorReports/${orgUri}`);
}
