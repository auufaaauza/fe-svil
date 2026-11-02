const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const moduleResult = { exports: {} };
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,"../app/lib/navigation.ts"),"utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(source,{exports:moduleResult.exports});
const navigation = moduleResult.exports;

test("visitors reach login and logged-in accounts reach their own workspace", () => {
  assert.equal(navigation.sessionDestination(null,"/guru/materi"),"/login");
  assert.equal(navigation.sessionDestination(null,"/login"),null);
  assert.equal(navigation.sessionDestination(null,"/register"),null);
  assert.equal(navigation.sessionDestination("student","/register"),"/siswa");
  assert.equal(navigation.sessionDestination("student","/login"),"/siswa");
  assert.equal(navigation.sessionDestination("teacher","/"),"/guru");
  assert.equal(navigation.sessionDestination("admin","/login"),"/admin");
});
test("a role cannot render another role's page or an external redirect", () => {
  assert.equal(navigation.sessionDestination("student","/admin/madrasah"),"/siswa");
  assert.equal(navigation.sessionDestination("teacher","/admin"),"/guru");
  assert.equal(navigation.sessionDestination("admin","https://external.invalid"),"/admin");
  assert.equal(navigation.sessionDestination("student","/siswa/belajar"),null);
  assert.equal(navigation.sessionDestination("teacher","/guru/materi/materi/uuid"),null);
  assert.equal(navigation.sessionDestination("teacher","/guru/tinjauan/4"),null);
  assert.equal(navigation.sessionDestination("admin","/admin/konten/lkpd/1"),null);
  assert.equal(navigation.sessionDestination("admin","/admin/laporan/siswa/4"),null);
  assert.equal(navigation.sessionDestination("teacher","/admin/konten/materi/uuid"),"/guru");
  assert.equal(navigation.sessionDestination("student","/siswa-lain"),"/siswa");
});
test("lesson links are restorable and invalid query values cannot select an activity", () => {
  const location = navigation.lessonLocation("student",2,3);
  const query = new URL(location,"http://localhost").searchParams;
  assert.equal(navigation.lessonFromQuery(query.get("pertemuan"),4),2);
  assert.equal(navigation.lessonFromQuery(query.get("langkah"),5),3);
  for (const value of [null,"","0","-1","6","NaN","1e1","2.5","https://external.invalid"]) assert.equal(navigation.lessonFromQuery(value,4),null);
});
