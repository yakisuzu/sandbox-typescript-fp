console.log("mapで並列実行(reduce前説明)");

(async () => {
  const keys: number[] = [1, 2]; // 前処理で、ループしたい値と回数が決まる

  // map
  const keyResults: Promise<number>[] = keys.map(async key => { // ラムダ式にasyncをつけないとawaitできてない
    return await new Promise(resolve =>
      setTimeout(() => resolve(key * 2), 100),  // 本来はREST
    ) as unknown as Promise<number>;
  });

  console.log(keyResults); // Promiseのarrayになっている
  console.log(await Promise.all(keyResults)); // [2, 4]
  // できたように見えるが、mapでは順番に待つような処理をしないので、並列になってしまった
})();
