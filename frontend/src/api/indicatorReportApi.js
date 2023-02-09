import {postJson} from "./index";

export async function createIndicatorReport(params, userContext) {
  if (userContext.isSuperuser)
    return postJson(`/api/indicatorReport/`, params);
}
