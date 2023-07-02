import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations() {
  return getJson('/api/organizations/');
}

export async function fetchOrganizationsInterfaces() {
  return getJson('/api/organizations/interface/');
}

export async function fetchOrganizationsBasedOnGroup(groupUri) {
  return getJson('/api/organizations/' + groupUri);
}

export async function fetchOrganizationsGivenOrganizationAdmin(adminURI) {
  return getJson('/api/organizations/orgAdmin/' + adminURI);
}

export async function fetchOrganization(orgUri,) {
  return getJson('/api/organization/' + orgUri);
}

export async function createOrganization(params) {
  return postJson('/api/organization/', params);
}

export async function updateOrganization(uri, params) {
  return putJson('/api/organization/' + uri, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id);
}