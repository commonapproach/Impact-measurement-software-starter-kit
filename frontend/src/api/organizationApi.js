import {deleteJson, getJson, postJson} from "./index";

export async function fetchOrganizations() {
  return getJson('/api/superuser/organizations');
}

export async function fetchOrganization(id) {
  return getJson('/api/superuser/organization/' + id);
}

export async function createOrganization(params) {
  return postJson('/api/superuser/organization/', params);
}