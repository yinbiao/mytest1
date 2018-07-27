// export const houseTypeData = [
//   { name: '不限' },
//   { name: '住宅' },
//   { name: '洋房' },
//   { name: '公寓' },
//   { name: '别墅' },
//   { name: '商铺' },
//   { name: '写字楼' }
// ]
// export const propertyTypeList = [
//   { type: 1, typeName: '住宅' },
//   { type: 2, typeName: '别墅' },
//   { type: 3, typeName: '写字楼' },
//   { type: 4, typeName: '商铺' },
//   { type: 5, typeName: '酒店式公寓' }
// ] 

//订单发起类型
export const orderTypeList = [
  { name: '报备订单', type: 0 },
  { name: '楼盘发起的合作订单', type: 1 },
  { name: '中介发起的二手房订单', type: 2 },
]

//物业类型
export const propertyTypeList = [
  { name: '不限物业类型', type: 0 },
  { name: '住宅', type: 1 },
  { name: '洋房', type: 2 },
  { name: '公寓', type: 3 },
  { name: '别墅', type: 4 },
  { name: '商铺', type: 5 },
  { name: '写字楼', type: 6 }
]
//户型
export const houseTypeList = [
  { type: 1, name: "1房" },
  { type: 2, name: "2房" },
  { type: 3, name: "3房" },
  { type: 4, name: "3房以上" }
]

//结佣速度
export const brokerageSpeedList = [
  { type: 1, name: "签约三天内" },
  { type: 2, name: "贷款通过三天内" },
  { type: 3, name: "贷款放款后三天内" }
]

//流程角色表

//界面展示的流程线路,数组值是流程编号
export const workFlowLine = {
  buildingToAgency:[3,4,5,6,7,8,9,10,11,12],
  agencyToBuilding:[1,2,5,6,7,8,9,10,11,12]
}

export const saleTypeList = [
  { name: '期房', type: 1 },
  { name: '现房', type: 2 },
  { name: '待售', type: 3 }
]
export const handsTypeList = [
  { name: '新房', type: 1 },
  { name: '二手房', type: 2 },
  { name: '租房', type: 3 }
]
export const areaTypeList = [
  { name: '60㎡以下', maxArea: 60 },
  { name: '60-90㎡', minArea: 60, maxArea: 90 },
  { name: '90-120㎡', minArea: 90, maxArea: 120 },
  { name: '120-150㎡', minArea: 120, maxArea: 150 },
  { name: '150㎡以上', minArea: 150 },
]
//楼盘单价筛选
export const priceTypeList = [
  { name: '不限楼盘单价', minPrice: 0 },
  { name: '2000元以下', minPrice: 0, maxPrice: 2000 },
  { name: '2000-3000元', minPrice: 2000, maxPrice: 3000 },
  { name: '3000-5000元', minPrice: 3000, maxPrice: 5000 },
  { name: '5000-6500元', minPrice: 5000, maxPrice: 6500 },
  { name: '6500-8000元', minPrice: 6500, maxPrice: 8000 },
  { name: '8000-10000元', minPrice: 8000, maxPrice: 10000 },
  { name: '10000元以上', minPrice: 10000,maxPrice: 100000000000 }
]
//需求预算范围
export const budgetRangeList = [
  { type: 0, budgetMin: 0, name: '不限预算' },
  { type: 1, budgetMin: 20, budgetMax: 50, name: '20~50万' },
  { type: 2, budgetMin: 50, budgetMax: 100, name: '50~100万' },
  { type: 3, budgetMin: 100, budgetMax: 200, name: '100~200万' },
  { type: 4, budgetMin: 200, budgetMax: 300, name: '200~300万' },
  { type: 5, budgetMin: 300, budgetMax: 500, name: '300~500万' },
  { type: 6, budgetMin: 500, name: '500万以上' }
]
export const directionalBuildingItem = [] //定向房源，后端动态输出
//地铁线
export const subwayList = [
  { name: 0, value: '不限地铁' },
  { name: 1, value: '1号线' },
  { name: 2, value: '2号线' },
  { name: 3, value: '3号线' },
  { name: 4, value: '4号线' },
  { name: 5, value: '5号线' },
  { name: 6, value: '6号线' },
  { name: 7, value: '7号线' },
  { name: 8, value: '8号线' },
  { name: 9, value: '9号线' },
  { name: 10, value: '10号线' },
  { name: 11, value: '11号线' },
  { name: 12, value: '12号线' },
  { name: 13, value: '13号线' },
  { name: 14, value: '14号线' },
  { name: 15, value: '15号线' },
  { name: 16, value: '16号线' },
  { name: 17, value: '17号线' }
]
//紧急程度
export const emergencyDegreeList = [
  { degreeName: '十万火急', type: 3 },
  { degreeName: '很着急', type: 2 },
  { degreeName: '还好', type: 1 },
  { degreeName: '不急', type: 0 }
]
export const genderList = [
  { name: '男', value: 1 },
  { name: '女', value: 2 }
]
export const userRoleList = [
  { name: '管理', value: 1 },
  { name: '经理', value: 2 },
  { name: '业务员', value: 3 },
]
export const userTypeList = [
  { name: '平台', value: 1 },
  { name: '中介', value: 2 },
  { name: '楼盘', value: 3 },
  { name: '游客', value: 4 },
]

function arr2Json(arr, key) {
  let _ = {}
  arr.forEach(v => {
    _[v[key]] = v
  })
  return _
}
export default {
  propertyType: arr2Json(propertyTypeList, 'type'),
  houseType: arr2Json(houseTypeList, 'type'),
  saleType: arr2Json(saleTypeList, 'type'),
  handsType: arr2Json(handsTypeList, 'type'),
  emergencyDegree: arr2Json(emergencyDegreeList, 'type'),
  gender: arr2Json(genderList, 'value'),
  userRole: arr2Json(userRoleList, 'value'),
  userType: arr2Json(userTypeList, 'value'),
  workFlowLine
}
