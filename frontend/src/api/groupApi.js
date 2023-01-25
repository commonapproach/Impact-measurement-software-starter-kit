import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchGroups(userContext){
  if(userContext.isSuperuser)
    return getJson('/api/superuser/groups/');
  if(userContext.groupAdminOf.length > 0)
    return getJson('/api/groupAdmin/groups/')
}

export async function deleteGroup(id) {
  return deleteJson('/api/superuser/group/' + id + '/');
}

export async function fetchGroup(id, userContext) {
  if(userContext.isSuperuser)
    return getJson('/api/superuser/group/' + id + '/');
  if(userContext.groupAdminOfs.length > 0)
    return getJson('/api/groupAdmin/group/' + id + '/');
}

export async function updateGroup(id, params, userTypes) {
  if(userTypes.includes('superuser'))
    return putJson('/api/superuser/group/' + id + '/', params);
  if(userTypes.includes('groupAdmin'))
    return putJson('/api/groupAdmin/group/' + id + '/', params);
}

export async function createGroup(params) {
  return postJson('/api/superuser/group/', params);
}