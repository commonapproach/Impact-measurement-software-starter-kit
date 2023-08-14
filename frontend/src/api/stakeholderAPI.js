import {deleteJson, getJson, postJson, putJson} from "./index";


export async function fetchOrganization(orgUri,) {
  return getJson('/api/organization/' + orgUri);
}

export async function fetchStakeholders() {
  return getJson('/api/stakeholders/');
}

export async function fetchStakeholder(stakeHolderUri) {
  return getJson('/api/stakeholder/' + stakeHolderUri)
}


export async function createStakeholder(params) {
  return postJson('/api/stakeholder/', params);
}

export async function updateStakeholder(uri, params) {
  return putJson('/api/stakeholder/' + uri, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id);
}