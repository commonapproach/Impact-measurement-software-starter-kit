import {deleteJson, getJson} from "./index";

export async function fetchOrganizations() {
  return getJson('/api/superuser/organizations');
}