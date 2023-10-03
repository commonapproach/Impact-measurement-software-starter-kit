import {getJson, postJson, putJson} from "./index";

export async function fetchImpactReportInterfaces() {
  return getJson('/api/fetchImpactReports/interface');
}

export async function fetchImpactReports(organizationUri) {
  return getJson('/api/impactReports/' + organizationUri + '/');
}

export async function fetchImpactReport(uri) {
  return getJson('/api/impactReport/' + uri);
}

export async function createIndicator(params) {
  return postJson(`/api/indicator/`, params);
}

export async function updateIndicator(params, uri) {
  return putJson(`/api/indicator/${uri}`, params);
}