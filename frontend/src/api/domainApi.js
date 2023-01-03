import {getJson, postJson} from "./index";

export async function createDomain(params) {
  return postJson('/api/superuser/domain/', params);
}

export async function fetchDomains(params) {
  return getJson('/api/general/domains/', params);
}