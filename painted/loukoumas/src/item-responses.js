/* Pure, independently reviewable item/target responses. Original puzzle callbacks run first. */
(function(root){const data=__ITEM_RESPONSES__;
function resolve(scene,target,item,lang='el',occurrence=0){const key=scene+'/'+target+'/'+item,pair=data.responses[key];if(!pair)throw Error('Uncovered item use: '+key);return pair[occurrence%pair.length][lang==='en'?1:0];}
root.LoukoumasItemResponses={data,resolve};
})(globalThis);
