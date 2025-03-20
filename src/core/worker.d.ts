declare module "*?worker" {
  export const workerConstructor: {
    new (): Worker;
  };
}
