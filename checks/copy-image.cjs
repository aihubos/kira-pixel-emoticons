const {readFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');
const assert=require('node:assert/strict');
const code=readFileSync('docs/app.js','utf8').split('async function copyImage')[1].split('function render()')[0];
(async()=>{
  for(const mode of ['success','denied','unsupported','fetch-failed']){
    let copied=false;
    const context={Blob,fetch:async()=>({ok:mode!=='fetch-failed',blob:async()=>new Blob(['png'])}),ClipboardItem:class{constructor(data){this.data=data;}},navigator:{clipboard:mode==='unsupported'?undefined:{write:async items=>{const blob=await items[0].data['image/png'];assert.equal(blob.type,'image/png');if(mode==='denied')throw Error('denied');copied=true;}}}};
    const copy=runInNewContext('async function copyImage'+code+';copyImage',context);
    const button={nextElementSibling:{textContent:''}};
    await copy({src:'assets/example.png'},button);
    assert.equal(copied,mode==='success');
    assert.equal(button.disabled,false);
    assert.equal(button.textContent,'이미지 복사');
    assert.ok(button.nextElementSibling.textContent.startsWith(mode==='success'?'복사됐어요':'복사하지 못했어요'));
  }
  console.log('PASS: copy success, denied permission, unsupported browser, failed image load');
})().catch(e=>{console.error(e);process.exitCode=1;});
