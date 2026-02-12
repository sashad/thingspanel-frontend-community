import { mockRequest } from '../request'

/** Get application management - Service management list */
export const fetchServiceManagementList = async () => {
  const data = await mockRequest.get<ServiceManagement.Service[]>('/getServiceManagementList')
  return data
}

/** Get a list of rule engines */
export const fetchRuleEngineList = async () => {
  const data = await mockRequest.get<Api.RuleEngine.Rule[] | null>('/getRuleEngineList')
  return data
}

/** Get data service list */
export const fetchDataServiceList = async () => {
  const data = await mockRequest.get<Api.DataService.Data[] | null>('/getDataServiceList')
  return data
}
