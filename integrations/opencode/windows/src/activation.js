import {createActivation as createCommonActivation} from '../updater/common/activation.js';
export const createActivation=options=>createCommonActivation({...options,application:'OpenCode',propagateRequestErrors:true});
