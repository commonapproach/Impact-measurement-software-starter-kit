import {getJson, postJson, putJson} from "./index";

export async function fetchIndicators(organizationId, userContext) {
  if (userContext.isSuperuser)
    return getJson('/api/indicators/' + organizationId + '/');
}

export async function fetchIndicator(id, userContext) {
  if (userContext.isSuperuser)
    return getJson('/api/indicator/' + id);
}

export async function createIndicator(params, userContext) {
  if (userContext.isSuperuser)
    return postJson(`/api/indicator/`, params);
}

export async function updateIndicator(params, id) {
  return putJson(`/api/indicator/${id}`, params)
}