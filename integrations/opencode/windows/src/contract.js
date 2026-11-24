const empty={type:'object',properties:{},additionalProperties:false};
export const Management={id:'finshield.opencode.management',methods:{
  version:{input:empty,output:{type:'object',properties:{version:{type:'string'}},required:['version'],additionalProperties:false}},
  ...Object.fromEntries(['status','exit','later'].map(name=>[name,{input:empty,output:{type:'object',additionalProperties:true}}])),
  install:{input:{type:'object',properties:{release:{type:'string'}},required:['release'],additionalProperties:false},output:{type:'object',additionalProperties:true}},
  attach:{input:{type:'object',properties:{mainPid:{type:'integer',minimum:1},desktop:{type:'string',minLength:1},activation:{type:'string',minLength:1,maxLength:64},connectedHostPid:{type:'integer',minimum:1},startup:{type:'boolean'}},required:['mainPid','desktop','activation','connectedHostPid'],additionalProperties:false},
    output:{type:'object',additionalProperties:true}},
},events:{}};
