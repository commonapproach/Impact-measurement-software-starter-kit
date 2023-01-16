import {getJson} from "./index";

export async function fetchIndicators(organizationId, userTypes){
  if(userTypes.includes('superuser'))
    return getJson('/api/superuser/indicators/' + organizationId + '/');
}