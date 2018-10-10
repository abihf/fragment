import PendingPromise from "./PendingPromise";

describe("PendingPromise util", () => {
  it("should resolve a value", () => {
    const pp = new PendingPromise();
    setTimeout(() => pp.resolve(123), 1);

    return expect(pp.promise).resolves.toEqual(123);
  });

  it("should throw error", () => {
    const pp = new PendingPromise();
    const err = new Error("error");
    setTimeout(() => pp.reject(err), 1);

    return expect(pp.promise).rejects.toEqual(err);
  });
});
