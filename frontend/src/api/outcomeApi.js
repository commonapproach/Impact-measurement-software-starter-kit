import {getJson, postJson, putJson} from "./index";

export async function fetchOutcomes(organizationUri) {
  return getJson('/api/outcomes/' + organizationUri + '/');
}

export async function fetchOutcomesThroughTheme(themeUri) {
  return getJson(`/api/outcomes/theme/${themeUri}/`)
}

export async function fetchOutcome(uri) {
  return getJson('/api/outcome/' + uri);
}

export async function fetchOutcomeInterfaces(organizationUri) {
  return getJson('/api/outcome/interface/' + organizationUri);
}

export async function createOutcome(params) {
  return postJson(`/api/outcome/`, params);
}

export async function updateOutcome(params, uri) {
  return putJson(`/api/outcome/${uri}`, params);
}