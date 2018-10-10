export default class PendingPromise<T> {
  public promise: Promise<T>;
  public resolve: (value?: T | PromiseLike<T>) => void;
  public reject: (reason?: any) => void;

  constructor() {
    this.resolve = this.reject = () => undefined; // to make typescript happy
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
