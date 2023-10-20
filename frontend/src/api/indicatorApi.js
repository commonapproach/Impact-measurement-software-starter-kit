import {getJson, postJson, putJson} from "./index";

export async function fetchIndicators(organizationUri) {
  return getJson('/api/indicators/' + organizationUri + '/');
}

export async function fetchIndicator(uri) {
  return getJson('/api/indicator/' + uri);
}

export async function fetchIndicatorInterfaces(organizationUri) {
  return getJson('/api/indicator/interface/' + organizationUri);
}

export async function createIndicator(params) {
  return postJson(`/api/indicator/`, params);
}

export async function updateIndicator(params, uri) {
  return putJson(`/api/indicator/${uri}`, params);
}