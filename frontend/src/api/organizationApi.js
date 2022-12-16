import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations(userTypes) {
  if(userTypes.includes('superuser'))
    return getJson('/api/superuser/organizations');
  if(userTypes.includes('groupAdmin'))
    return getJson('/api/groupAdmin/organizations');
  if(userTypes.includes('admin'))
    return getJson('/api/admin/organizations');
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