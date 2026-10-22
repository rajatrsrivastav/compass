import { _electron as electron } from '@playwright/test'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
const executable=process.argv[2]
if(!executable)throw new Error('Provide the packaged application executable path.')
const dir=mkdtempSync(join(tmpdir(),'compass-packaged-'))
const app=await electron.launch({executablePath:resolve(executable),env:{...process.env,OSS_COMPASS_DATA_DIR:dir}})
try{
 const page=await app.firstWindow()
 await page.getByLabel('GitHub username').fill('packaged-smoke-test')
 await page.getByRole('button',{name:'Create my workspace'}).click()
 await page.getByRole('button',{name:'Explore demo workspace'}).click()
 await page.getByRole('button',{name:'Opportunity Radar',exact:true}).click()
 await page.getByRole('heading',{name:'Reduce canvas redraws during playback'}).waitFor()
 const packaged=await app.evaluate(({app})=>app.isPackaged)
 if(!packaged)throw new Error('Expected packaged executable')
 console.log('PASS: packaged Electron app launched; SQLite onboarding, demo seeding, and issue navigation succeeded; app.isPackaged=true.')
}finally{await app.close();rmSync(dir,{recursive:true,force:true})}
