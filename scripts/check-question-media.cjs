const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const path=require("node:path");
const moduleCode=ts.transpileModule(fs.readFileSync(path.join(__dirname,"../app/lib/question-media.ts"),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exported={};vm.runInNewContext(moduleCode,{exports:exported,URL});
const parse=exported.parseQuestionVideo;

test("normalizes YouTube and canonical TikTok into allowlisted player IDs",()=>{
  for(const url of ["https://youtu.be/abcdefghijk","https://youtube.com/watch?v=abcdefghijk&t=30","https://www.youtube.com/shorts/abcdefghijk","https://www.youtube-nocookie.com/embed/abcdefghijk"]){assert.equal(parse(url).id,"abcdefghijk");assert.equal(parse(url).provider,"youtube");}
  assert.equal(parse("https://www.tiktok.com/@guru/video/6718335390845095173?is_from_webapp=1").id,"6718335390845095173");
  assert.equal(parse("https://vm.tiktok.com/Z123/").provider,"link");
  assert.equal(parse("https://video.example.com/lesson.mp4?token=123").provider,"file");
});
test("rejects insecure and malformed preview URLs and never embeds an arbitrary website",()=>{
  for(const input of [null,"","javascript:alert(1)","http://youtube.com/watch?v=abcdefghijk","https://user:password@example.com/video","https://127.0.0.1/video","https://localhost/video","https://youtube.com/watch?v=wrong","<iframe>…</iframe>"]){assert.equal(parse(input),null);}
  assert.equal(parse("https://youtube.com.attacker.example/video").provider,"link");
});
