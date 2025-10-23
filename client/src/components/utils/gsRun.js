export const gsRun = (fn, ...args) =>
  new Promise((resolve, reject) => {
    const run = window?.google?.script?.run;
    if (!run) return reject(new Error("google.script.run not available"));
    run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [fn](...args);
  });
