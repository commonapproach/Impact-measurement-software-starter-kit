import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchGroups(userContext) {
  return getJson('/api/groups/');

}

export async function deleteGroup(id) {
  return deleteJson('/api/superuser/group/' + id + '/');
}

export async function fetchGroup(id, userContext) {
  return getJson(`/api/group/${id}/`)
}

export async function updateGroup(id, params, userContext) {
  return putJson('/api/group/' + id + '/', params);
  if (userContext.isSuperuser)
    return putJson('/api/superuser/group/' + id + '/', params);
  if (userContext.groupAdminOf?.length > 0)
    return putJson('/api/groupAdmin/group/' + id + '/', params);
}

export async function createGroup(params) {
  return postJson('/api/group/', params);
}