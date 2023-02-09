import {getJson, postJson} from "./index";

export async function createIndicatorReport(params, userContext) {
  if (userContext.isSuperuser)
    return postJson(`/api/indicatorReport/`, params);
}

export async function fetchIndicatorReport(id, userContext) {
  if (userContext.isSuperuser)
    return getJson(`/api/indicatorReport/${id}`)
}
