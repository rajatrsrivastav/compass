import {existsSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs'
interface Encryption {isEncryptionAvailable:()=>boolean;encryptString:(text:string)=>Buffer;decryptString:(buffer:Buffer)=>string;getSelectedStorageBackend?:()=>string}
export class Credentials {
 private token:string|undefined;private persistent=false
 constructor(private path:string,private encryption:Encryption){if(existsSync(path)&&this.secure()){try{this.token=encryption.decryptString(readFileSync(path));this.persistent=true}catch{ /* Keychain unavailable: ask user to re-enter, never expose ciphertext. */ }}}
 private secure(){return this.encryption.isEncryptionAvailable()&&this.encryption.getSelectedStorageBackend?.()!=='basic_text'}
 get(){return this.token}
 status(){return {present:!!this.token,persistent:this.persistent}}
 set(token:string,persist:boolean){if(persist&&!this.secure())throw new Error('OS-backed encryption is unavailable. Choose session-only storage.');this.clear();if(persist){writeFileSync(this.path,this.encryption.encryptString(token),{mode:0o600});this.persistent=true}this.token=token}
 clear(){this.token=undefined;this.persistent=false;if(existsSync(this.path))unlinkSync(this.path)}
}
