// 由 tools/generate.mjs 生成；数据来源为 apifox-mock/data。

function respond(data, code, msg) {
  fox.mockResponse.setBody({ data: data === undefined ? null : data, code: code || '0000', msg: msg || '请求成功' });
}
function param(name) {
  return fox.mockRequest.getParam(name);
}
function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}
function text(value) {
  return String(value === undefined || value === null ? '' : value).toLowerCase();
}
function page(items) {
  var pageNum = Math.max(1, Number(param('pageNum')) || 1);
  var pageSize = Math.max(1, Number(param('pageSize')) || 10);
  var start = (pageNum - 1) * pageSize;
  return { list: items.slice(start, start + pageSize), total: items.length, pageNum: pageNum, pageSize: pageSize };
}
function authorization() {
  var headers = fox.mockRequest.headers;
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get('Authorization') || headers.get('authorization') || '';
  return headers.Authorization || headers.authorization || '';
}

function main() {
  var accounts = [{"userId":"0","userName":"Soybean","password":"123456","userRole":"R_SUPER","nickname":"林知夏","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IlNveWJlYW4ifV0sImlhdCI6MTY5ODQ4NDg2MywiZXhwIjoxNzMwMDQ0Nzk5LCJhdWQiOiJzb3liZWFuLWFkbWluIiwiaXNzIjoiU295YmVhbiIsInN1YiI6IlNveWJlYW4ifQ._w5wmPm6HVJc5fzkSrd_j-92d5PBRzWUfnrTF1bAmfk","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IlNveWJlYW4ifV0sImlhdCI6MTY5ODQ4NDg4MSwiZXhwIjoxNzYxNTgwNzk5LCJhdWQiOiJzb3liZWFuLWFkbWluIiwiaXNzIjoiU295YmVhbiIsInN1YiI6IlNveWJlYW4ifQ.7dmgo1syEwEV4vaBf9k2oaxU6IZVgD2Ls7JK1p27STE"},{"userId":"1","userName":"Super","password":"123456","userRole":"R_SUPER","nickname":"周景行","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IlN1cGVyIn1dLCJpYXQiOjE2OTg0ODQ5NDMsImV4cCI6MTczMDA0NDc5OSwiYXVkIjoic295YmVhbi1hZG1pbiIsImlzcyI6IlNveWJlYW4iLCJzdWIiOiJTdXBlciJ9.NcOqGoOUEwqrW_uH53LQskG9gnOReXYksn5CC8HLVQ4","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IlN1cGVyIn1dLCJpYXQiOjE2OTg0ODQ5MjQsImV4cCI6MTc2MTU4MDc5OSwiYXVkIjoic295YmVhbi1hZG1pbiIsImlzcyI6IlNveWJlYW4iLCJzdWIiOiJTdXBlciJ9.VP4-PRJhufEQEVBo9L0X1XtfjPMxJBVi8J4Y0ZuL3Ss"},{"userId":"2","userName":"Admin","password":"123456","userRole":"R_ADMIN","nickname":"陈知行","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IkFkbWluIn1dLCJpYXQiOjE2OTg0ODQ5NzIsImV4cCI6MTczMDA0NDc5OSwiYXVkIjoic295YmVhbi1hZG1pbiIsImlzcyI6IlNveWJlYW4iLCJzdWIiOiJBZG1pbiJ9.rLqWqgErEAgX4EVy_Kl_Eb1_bDmXyiZ9bZaupVgyv5M","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IkFkbWluIn1dLCJpYXQiOjE2OTg0ODQ5ODQsImV4cCI6MTc2MTU4MDc5OSwiYXVkIjoic295YmVhbi1hZG1pbiIsImlzcyI6IlNveWJlYW4iLCJzdWIiOiJBZG1pbiJ9.QLrSKVlFXAzBb3v0BFzyxBbzrVMg58SF9oLS46Z8bFI"},{"userId":"3","userName":"User","password":"123456","userRole":"R_USER_COMMON","nickname":"苏念","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IlVzZXIwMSJ9XSwiaWF0IjoxNjk4NDg1MDEzLCJleHAiOjE3MzAwNDQ3OTksImF1ZCI6InNveWJlYW4tYWRtaW4iLCJpc3MiOiJTb3liZWFuIiwic3ViIjoiVXNlcjAxIn0.7m4r2DUYSd5EIihOeNc2aHLhBseWm3BWhormma-TPbU","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IlVzZXIwMSJ9XSwiaWF0IjoxNjk4NDg1MDAwLCJleHAiOjE3NjE1ODA3OTksImF1ZCI6InNveWJlYW4tYWRtaW4iLCJpc3MiOiJTb3liZWFuIiwic3ViIjoiVXNlcjAxIn0.vXnUgwcf-y0UQWj5GZO-q2MEkCHsjGM06WgJ-I9f7cc"}];
  var account = accounts.find(function (item) { return item.refreshToken === param('refreshToken'); });
  if (!account) return respond(null, '8888', '登录状态无效');
  respond({ token: account.token, refreshToken: account.refreshToken });
}

main();
