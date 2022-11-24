import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations() {
  return getJson('/api/superuser/organizations');
}

export async function fetchOrganization(id) {
  return getJson('/api/superuser/organization/' + id);
}

export async function createOrganization(params) {
  return postJson('/api/superuser/organization/', params);
}

export async function updateOrganization(id, params) {
  return putJson('/api/superuser/organization/' + id, params)
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id)
}