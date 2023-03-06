import {getJson, postJson, putJson} from "./index";

export async function createIndicatorReport(params) {
  return postJson(`/api/indicatorReport/`, params);
}

export async function fetchIndicatorReport(id) {
  return getJson(`/api/indicatorReport/${id}`);
}

export async function updateIndicatorReport(id, params) {
  return putJson(`/api/indicatorReport/${id}`, params);
}

export async function fetchIndicatorReports(orgId) {
  return getJson(`/api/indicatorReports/${orgId}`);
}
