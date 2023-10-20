import {getJson, postJson, putJson} from "./index";

export async function fetchStakeholderOutcomes() {
  return getJson('/api/stakeholderOutcomes/');
}

export async function fetchStakeholderOutcomesThroughStakeholder(stakeholderUri) {
  return getJson(`/api/stakeholderOutcome/stakeholder/${stakeholderUri}`)
}

export async function fetchStakeholderOutcomesThroughOrganization(organizationUri) {
  return getJson(`/api/stakeholderOutcome/organization/${organizationUri}`)
}

export async function fetchStakeholderOutcome(uri) {
  return getJson('/api/stakeholderOutcome/' + uri);
}

export async function fetchStakeholderOutcomeInterface(organizationUri) {
  return getJson('/api/stakeholderOutcome/interfaces/' + organizationUri);
}

export async function createStakeholderOutcome(params) {
  return postJson(`/api/stakeholderOutcome/`, params);
}

export async function updateOutcome(params, uri) {
  return putJson(`/api/outcome/${uri}`, params);
}