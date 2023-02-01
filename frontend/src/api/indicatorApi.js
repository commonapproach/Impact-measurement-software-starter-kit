import {getJson} from "./index";

export async function fetchIndicators(organizationId, userContext){
  if(userContext.isSuperuser)
    return getJson('/api/indicators/' + organizationId + '/');
}