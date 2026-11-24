import {createUpdater as createCommonUpdater} from './common/coordinator.js';
export const createUpdater=options=>createCommonUpdater({...options,application:'OpenCode'});
