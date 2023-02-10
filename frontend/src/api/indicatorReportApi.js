import {getJson, postJson, putJson} from "./index";

export async function createIndicatorReport(params, userContext) {
  if (userContext.isSuperuser)
    return postJson(`/api/indicatorReport/`, params);
}

export async function fetchIndicatorReport(id, userContext) {
  if (userContext.isSuperuser)
    return getJson(`/api/indicatorReport/${id}`)
}

export async function updateIndicatorReport(id, userContext, params) {
  if (userContext.isSuperuser)
    return putJson(`/api/indicatorReport/${id}`, params)
}

export async function fetchIndicatorReports(orgId, userContext) {
  if (userContext.isSuperuser)
    return getJson(`/api/indicatorReports/${orgId}`)
}
