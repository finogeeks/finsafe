/** One plugin activation. Native observations, not environment flags, prove protection. */
export async function activateHandoff(config, { readToken, record, startHelper }) {
  const token = readToken();
  if (token.appContainer && !token.expectedPackage) throw new Error('Host is in a different AppContainer');
  if (token.appContainer && token.expectedPackage) {
    record({ phase: 'protected', token });
    return;
  }
  if ((config.generation ?? 'initial') !== 'initial') throw new Error('Relaunched Host is not in the expected AppContainer');
  record({ phase: 'initial', token });
  await startHelper();
}

/** Product page uses this DSH process's AppContainer state; native launch owns admission. */
export async function activatePlugin({token},{record,ready}) {
  if(token.appContainer) {
    record({phase:'protected',token});
    return;
  }
  record({phase:'initial',token});
  await ready();
}
