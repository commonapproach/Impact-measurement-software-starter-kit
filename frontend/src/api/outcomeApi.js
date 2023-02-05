import {getJson, postJson, putJson} from "./index";

export async function fetchOutcomes(organizationId, userContext) {
  if (userContext.isSuperuser)
    return getJson('/api/outcomes/' + organizationId + '/');
}

export async function fetchOutcome(id, userContext) {
  if (userContext.isSuperuser)
    return getJson('/api/outcome/' + id);
}

export async function createOutcome(params, userContext) {
  if (userContext.isSuperuser)
    return postJson(`/api/outcome/`, params);
}

export async function updateOutcome(params, id) {
  return putJson(`/api/outcome/${id}`, params)
}