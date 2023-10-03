import {getJson, postJson, putJson} from "./index";

export async function fetchStakeholderOutcomes(organizationUri) {
  return getJson('/api/stakeholderOutcomes/' + organizationUri + '/');
}

export async function fetchStakeholderOutcomesThroughStakeholder(stakeholderUri) {
  return getJson(`/api/stakeholderOutcome/stakeholder/${stakeholderUri}`)
}

export async function fetchStakeholderOutcome(uri) {
  return getJson('/api/stakeholderOutcome/' + uri);
}

export async function fetchStakeholderOutcomeInterface() {
  return getJson('/api/stakeholderOutcome/interfaces');
}

export async function createOutcome(params) {
  return postJson(`/api/outcome/`, params);
}

export async function updateOutcome(params, uri) {
  return putJson(`/api/outcome/${uri}`, params);
}