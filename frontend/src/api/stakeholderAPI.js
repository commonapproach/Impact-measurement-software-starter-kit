import {deleteJson, getJson, postJson, putJson} from "./index";


export async function fetchOrganization(orgUri,) {
  return getJson('/api/organization/' + orgUri);
}

export async function createStakeholder(params) {
  return postJson('/api/stakeholder/', params);
}

export async function updateOrganization(uri, params) {
  return putJson('/api/organization/' + uri, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id);
}